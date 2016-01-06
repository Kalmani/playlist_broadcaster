var path = require('path');
var http = require('http');
var bodyParser= require('body-parser');
var express = require('express');
var playlist_broadcaster = require('./libs/playlist_broadcaster/');


var app    = express();
var router = express.Router() ;
router.use('/' , express.static('./'));
router.use(bodyParser());

app.use('/' , router) ;

var server = http.createServer(app).listen(8080, function () {
  console.log("Started REST Server on port 8080");
  var playlist = new playlist_broadcaster(server);
  playlist.launch();
});






