/*//Lets require/import the HTTP module
var http = require('http');
var dispatcher = require('httpdispatcher');
//Lets define a port we want to listen to
const PORT = 8080; 

//We need a function which handles requests and send response
function handleRequest(request, response){
  try {
    //log the request on console
    console.log(request.url);
    //Disptach
    dispatcher.dispatch(request, response);
  } catch(err) {
    console.log(err);
  }
}

//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT, '127.0.0.1');
});*/


var Server = require('ubk/server');
//var Client = require('ubk/client/tcp');

var server = new Server();
//var client = new Client({server_port:port});

//very simple RPC design
/*client.register_rpc("math", "sum", function(a, b, chain){
    //heavy computational operation goes here
  chain(a + b);
});*/

server.on('base:registered_client', function(device){
  var device = server.get_client(device.client_key);
  console.log('DEVICE IS  : ' + device);
});

server.register_cmd('base', 'send_test', function(args) {
  console.log('ici', args);
  server.broadcast('base', 'send_test', {'toto' : 'tata'});
});

server.start_socket_server(function(){
  console.log('socket server open');
});








var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(__dirname)).listen(8080);