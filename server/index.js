var path = require('path');

var playlist_broadcaster = require('./libs/playlist_broadcaster/');

var playlist = new playlist_broadcaster();

playlist.launch();

var connect = require('connect');
var serveStatic = require('serve-static');
connect().use(serveStatic(path.resolve('./'))).listen(8080);