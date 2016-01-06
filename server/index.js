var path                 = require('path'),
    http                 = require('http'),
    Class                = require('uclass'),
    bodyParser           = require('body-parser'),
    express              = require('express'),
    // modules
    Playlist_broadcaster = require('./modules/playlist_broadcaster'),
    Ffmpeg               = require('./modules/ffmpeg'),
    Manager              = require('./modules/playlist_manager')

Playlist_server = new Class({

  globales : {
    _EXEC             : "ffmpeg",
    _INCOMING_PATH    : './incomming',
    _OUTPUT_PATH      : './outputs/fresh/',
    _PLAYLIST_NAME    : 'playlist.json',
    _ROOT_PATH        : './outputs',
  },

  modules : {},

  initialize : function() {
    var self = this;

    self.app    = express();
    self.router = express.Router();

    self.expose();
  },

  expose : function() {
    var self = this;

    self.router.use('/' , express.static('./'));
    self.router.use(bodyParser());
    self.app.use('/' , self.router);

    self.router.use('/admin' , express.static('./server/manager'));

    self.create_server();
  },

  create_server : function() {
    var self = this;

    var server = http.createServer(self.app).listen(8080, function () {
      console.log("Started REST Server on port 8080");
      self.launch_broadcaster(server);
    });
  },

  launch_broadcaster : function(server) {
    var self = this,
        modules = [
          Ffmpeg,
          Playlist_broadcaster,
          Manager
        ];

    Array.each(modules, function(module) {
      var instance = new module(self.globales, server);
      console.log('initializing module : ' + instance.ID);
      self.modules[instance.ID] = instance;
    });

    Object.each(self.modules, function(module_instance, id) {
      console.log('starting module : ' + id);
      module_instance.start(self);
    });
  }
});

var server = new Playlist_server();
