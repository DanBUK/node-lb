var
  http = require('http'),
   sys = require('sys')
;

var nodePool = function () {
  this.nodes = [];
  this.no_nodes_count = 0;
  this.last_nodeid = -1;
  var obj = this;
  this.checkInterval = setInterval(function () {
    if(obj.nodes.length > 0) {
      for(var i = 0; i < obj.nodes.length; i++) {
        obj.checkNode(i);
      }
    }
  }, 500);
  return this;
};
nodePool.prototype.addNode = function (host, port, healthcheck, response) {
  this.nodes.push({
    host: host,
    port: port,
    healthcheck: healthcheck,
    response: response,
    enabled: false,
    conn_count_attempt: 0,
    conn_count: 0,
    hist_conn_count_attempt: [],
    hist_conn_count: []
  });
};
nodePool.prototype.bumpLastNodeId = function () {
  this.last_nodeid++;
  if(this.last_nodeid == this.nodes.length) {
    this.last_nodeid = 0;
  }
};
nodePool.prototype.getNode = function () {
  var db_str = "getNode:\nlast_nodeid: " +  this.last_nodeid + "\n";
  if(this.last_nodeid == -1) {
    this.last_nodeid = 0;
  } else {
    this.bumpLastNodeId();
  }
  var firstNodeId = this.last_nodeid;
  db_str += "firstNodeId: " +  firstNodeId + "\n";
  var resp = firstNodeId;
  while(this.nodes[this.last_nodeid].enabled != true) {
    this.bumpLastNodeId();
    if(this.last_nodeid == firstNodeId) {
      this.last_nodeid = null;
      break;
    }
  }
  db_str += "last_nodeid: " +  this.last_nodeid + "\n";
  sys.print(db_str);
  // this.incrNodeCount(this.last_nodeid);
  return this.last_nodeid;
};
nodePool.prototype.incrNodeCountAttempt = function (num) {
  this.nodes[num].conn_count_attempt++;
};
nodePool.prototype.incrNodeCount = function (num) {
  this.nodes[num].conn_count++;
};
nodePool.prototype.decrNodeCount = function (num) {
  this.nodes[num].conn_count--;
};
nodePool.prototype.incrNoNodesCount = function () {
  this.no_nodes_count++;
};
nodePool.prototype.checkNode = function (num) {
  var myNode = this.nodes[num];
  var httpClient = http.createClient(myNode.port, myNode.host);
  var req = httpClient.request('GET', myNode.healthcheck, {host: myNode.host});
  httpClient.on('error', function (error) {
    if(error.errno == process.ECONNREFUSED) {
      if(myNode.enabled == true) {
        myNode.hist_conn_count_attempt.push(myNode.conn_count_attempt);
        myNode.hist_conn_count.push(myNode.conn_count);
      }
      myNode.enabled = false;
      myNode.conn_count_attempt = 0;
      myNode.conn_count = 0;
    }
  });
  req.on('response', function (resp) {
    resp.setEncoding('utf8');
    var buff = "";
    resp.on('data', function (data) {
      buff += data;
    });
    resp.on('end', function () {
      if(buff == myNode.response) {
        myNode.enabled = true;
      } else {
        myNode.enabled = false;
      }
    });
  });
  req.end();
};
exports.new = function () {
  return new nodePool();
};