var http = require('http');
var sys  = require('sys');

http.createServer(function (request, response) {
  response.writeHead(200, {'Content-Type': 'text/plain'});
  if(request.url == '/healthcheck') {
    var resp = "OK";
  } else {
    var resp = process.argv[2] + "\n";
  }
  response.end(resp);
}).listen(parseInt(process.argv[2], 10));
