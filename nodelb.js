var 
  sys = require('sys'),
  net = require('net'),
  nodePool = require('./nodePool')
;

exports.new = function (port, host, nodes)  {
  this.host = host;
  this.port = port;
  this.node_pool = nodePool.new();
  for(var i in nodes) {
    this.node_pool.addNode(nodes[i][0], nodes[i][1], nodes[i][2], nodes[i][3]);
  }
  var lbobj = this;
  this.server = net.createServer(function (srvsocket) {
    var buff = "";
    var buff_out = "";
    var nc = 0;
    srvsocket.setEncoding('utf8');
    srvsocket.on('connect', function () {
      var my_nodeid = lbobj.node_pool.getNode();
      if(my_nodeid == null) {
        lbobj.node_pool.incrNoNodesCount();
        srvsocket.end("No nodes available A\n");
      } else {
        lbobj.node_pool.incrNodeCountAttempt(my_nodeid);
        sys.print(sys.inspect(lbobj.node_pool.nodes[my_nodeid]) + "\n");
        var nodesock = net.createConnection(lbobj.node_pool.nodes[my_nodeid].port, lbobj.node_pool.nodes[my_nodeid].host);
        nc++;
        nodesock.setEncoding('utf8');
        nodesock.on('error', function (error) {
          sys.print("nodesock.on['error']: " + lbobj.node_pool.nodes[my_nodeid].host + ":" + lbobj.node_pool.nodes[my_nodeid].port + "\n");
          if(error.errno == process.ECONNREFUSED) {
            my_nodeid = lbobj.node_pool.getNode();
            sys.print("my_nodeid: " + my_nodeid + "\n");
            if(nc == lbobj.node_pool.nodes.length) {
              lbobj.node_pool.incrNoNodesCount();
              sys.print("No nodes available\n");
              srvsocket.end("No nodes available B\n");
            } else {
              lbobj.node_pool.incrNodeCountAttempt(my_nodeid);
              sys.print(sys.inspect(lbobj.node_pool.nodes[my_nodeid]) + "\n");
              nodesock.connect(lbobj.node_pool.nodes[my_nodeid].port, lbobj.node_pool.nodes[my_nodeid].host);
              nc++;
            }
          } else {
            sys.print("Unknown error [" + my_nodeid + "] : " + sys.inspect(error) + "\n");
          }
        });
        nodesock.on('connect', function () {
          lbobj.node_pool.incrNodeCount(my_nodeid);
          if(buff != "") {
            nodesock.write(buff, 'utf8');
            buff = "";
          }
        });
    
        nodesock.on('data', function (data) {
          /* if(srvsocket.writable != true) {
            buff_out += data;
          } else { */
            srvsocket.write(data, 'utf8');
          // }
        });
        
        nodesock.on('close', function (had_error) {
          // this.decrNodeCount(my_nodeid);
          srvsocket.destroy();
        });
        srvsocket.on('data', function (data) {
          if(nodesock.writable != true) {
            buff += data;
          } else {
            nodesock.write(data, 'utf8');
          }
        });
        srvsocket.on('close', function (had_error) {
          // sys.print("buff_out: " + buff_out + "\n");
          if(nodesock.readyState != 'closed') {
            nodesock.destroy();
          }
        });
      }
    });
  });
  this.start = function () {
    this.server.listen(this.port, this.hostname);
  };
  this.stop = function () {
    this.server.close();
  };
  return this;
};