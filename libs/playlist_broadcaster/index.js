var Server   = require('ubk/server'),
    Class    = require('uclass'),
    chokidar = require('chokidar'),
    ffmpeg   = require('../ffmpeg'),
    guid     = require('mout/random/guid'),
    slice    = require('mout/array/slice'),
    path     = require('path'),
    fs       = require('fs'),
    mp4js    = require('mp4js');

var playlist_broadcaster = new Class({

  Binds : ['scan_incommings'],
  
  _INCOMING_PATH : './incomming',
  _OUTPUT_PATH   : './outputs',

  devices : {},

  initialize : function() {

  },

  launch : function() {
    var self = this;

    self.server = new Server();

    self.server.on('base:registered_client', function(device){
      self.devices[device.client_key] = self.server.get_client(device.client_key);
      console.log('DEVICE IS  : ' + self.devices[device.client_key]);
    });

    self.broadcaster();

    self.server.start_socket_server(function(){
      console.log('socket server open');
      self.watch_incomming();
    });
  },

  broadcaster : function() {
    var self = this;

    self.server.register_cmd('base', 'send_cmd', function(data) {
      self.server.broadcast('base', 'send_cmd', data.args);
    });

    self.server.register_cmd('base', 'ask_video', function(device, data) {
      self.launch_video(device, data); //temp
    });

    self.server.register_cmd('base', 'ask_playlist', function(device, data) {
      self.send_playlist(device, data);
    });
  },

  watch_incomming : function() {
    var self = this;


    self.incomings = [];

    chokidar.watch(self._INCOMING_PATH, {ignored: /[\/\\]\./}).on('all', function(event, path){
      console.log(event, path);
      switch (event) {
        case 'add' :
          self.incomings.push(path);
          break;
      }
    });

    self.timer = setInterval(self.scan_incommings, 2000);

  },

  scan_incommings : function() {
    var self = this;
    console.log('start scaning...');
    var output_path = './outputs/';

    clearInterval(self.timer);
    if (!self.incomings[0]) {
      self.timer = setInterval(self.scan_incommings, 2000);
      return;
    }
    var output_file = path.basename(self.incomings[0]).replace(path.extname(self.incomings[0]), '.mp4');

    var encode = new ffmpeg(self.incomings[0], output_path + output_file, function() {
      self.timer = setInterval(self.scan_incommings, 2000);
    });

    if (self.incomings[1]) {
      self.incomings = slice(self.incomings, 1);
    } else {
      self.incomings = [];
    }
  },

  launch_video : function(device, data) {
    var self = this;
    var filepath = data.args.filepath;
    self.server.broadcast('base', 'launch_video', {filepath : filepath});
    //device.respond(data, {filepath : filepath});
  },

  send_playlist : function(device, data) {
    var playlist = JSON.parse(fs.readFileSync('./playlists/playlist_1.json', 'utf8'));
    var dom = "";

    for (var i = 0; i < playlist.videos.length; i++) {
      dom += '<span class="play_video" rel="' + playlist.videos[i] + '">' + playlist.videos[i] + '</span><br />';
    }
    device.respond(data, {'dom' : dom});
  }
});

module.exports = playlist_broadcaster;
