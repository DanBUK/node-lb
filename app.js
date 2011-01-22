#!/usr/bin/env node
/* node-lb.js
 * A simple TCP load balancer.
 * 
 * Written by Daniel Bartlett <dan@f-box.org>
 * 23rd November 2010 - Moved to a more modular design
 * 20th November 2010 - Updated to use simple HTTP health checks 
 * 19th November 2010 - Initial Release
 * Usage: node-lb.js <listening port> <backend 1> <backend 2> <backend n> ..
 * A <backend> is defined as <host>:<port>:<health check path>:<expected response>
 */

var
   net   = require('net'),
   sys   = require('sys'),
  http   = require('http'),
  nodelb = require('./nodelb')
;

var argv = process.argv;
argv.shift(); argv.shift();
var port = parseInt(argv.shift());

var nodeprts = null;
var nodes = [];
var node = undefined;
node = argv.shift();
while(node != undefined) {
  nodeprts = node.split(":");
  nodes.push([nodeprts[0], parseInt(nodeprts[1]), nodeprts[2], nodeprts[3]]);
  node = argv.shift();
}

if((port < 1 || port > 65535) || nodes.length < 1) {
  sys.print(
    "Invalid Usage\n" +
    "node-lb.js <listening port> <backend 1> <backend 2> <backend n>\n" +
    "eg.\n" +
    "node-lb.js 10001 127.0.0.1:11001:/healthcheck:OK 127.0.0.1:11002:/healthcheck:OK 127.0.0.1:11003:/healthcheck:OK\n\n" +
    "This would mean that the healthcheck is looking for the string 'OK' as the complete body of the response, any extra characters will cause the check to fail.\node"
  );
  process.exit(1);
}
var debugs = {};

var server_http = http.createServer(function(req, resp) {
  resp.writeHead(200, {'Content-Type': 'text/plain'});
  for(var i in debugs) {
    if(i == 'nodeLBa') {
      var out_str = i + "\n";
      out_str += " host: " + debugs[i].host + "\n";
      out_str += " port: " + debugs[i].port + "\n";
      out_str += " nodes:\n";
      for(var j in debugs[i].node_pool.nodes) {
        if(j != 0) {
          out_str += "\n";
        }
        out_str += "  " + j + ": \n";
        var node_str = sys.inspect(debugs[i].node_pool.nodes[j]);
        // node_str.replace(/\n/g, "\n   ");
        node_str.replace(/hist_conn_count: *$/ig, "hist_conn_count: " + sys.inspect(debugs[i].node_pool.nodes[j].hist_conn_count));
        out_str += node_str;
      }
      out_str += "\n no_nodes_count: " + debugs[i].node_pool.no_nodes_count + "\n";
      out_str += " last_nodeid: " + debugs[i].node_pool.last_nodeid + "\n";
      resp.write(out_str);
    } else {
      resp.write(i + "\n" + sys.inspect(debugs[i]) + "\n");
    }
  }
  resp.end("end\n");
});
// debugs['server_http'] = server_http;
server_http.listen(10010);

var nodeLBa = nodelb.new(port, "127.0.0.1", nodes);
debugs['nodeLBa'] = nodeLBa;
nodeLBa.start();