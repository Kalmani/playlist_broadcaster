var Server   = require('ubk/server'),
    Class    = require('uclass'),
    chokidar = require('chokidar'),
    ffmpeg   = require('../ffmpeg'),
    guid     = require('mout/random/guid'),
    slice    = require('mout/array/slice'),
    path     = require('path'),
    fs       = require('fs');

var playlist_broadcaster = new Class({

  Binds : ['scan_incommings'],
  
  _INCOMING_PATH    : './incomming',
  _OUTPUT_PATH      : './outputs/',
  _PLAYLISTS_PATH   : './playlists/',
  _DEFAULT_PLAYLIST : 'playlist_default.json',

  is_encrypting     : false,

  devices : {},

  initialize : function() {
    this.ffmpeg = new ffmpeg();
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
          self.scan_incommings();
          break;
      }
    });
  },

  scan_incommings : function() {
    var self = this;

    //nothing to encrypt
    if (!self.incomings[0])
      return;
    //already encrypting
    if (self.is_encrypting == true)
      return;

    var output_file = path.basename(self.incomings[0]).replace(path.extname(self.incomings[0]), '.mp4');

    self.is_encrypting = true;

    var encode = self.ffmpeg.encode(self.incomings[0], self._OUTPUT_PATH + output_file, function(exit_code) {
      if (exit_code != 0)
        console.log('An error occured while encrypting file : ' + self.incomings[0]);
      self.incomings = (self.incomings[1]) ? slice(self.incomings, 1) : [];

      self.push_default_playlist(output_file, function() {
        self.is_encrypting = false;
        self.scan_incommings();
      });
    });
  },

  push_default_playlist : function(output_file, callback) {
    var self = this,
        playlist = JSON.parse(fs.readFileSync(self._PLAYLISTS_PATH + self._DEFAULT_PLAYLIST, 'utf8'));
    playlist.videos.push(self._OUTPUT_PATH + output_file);
    fs.writeFileSync(self._PLAYLISTS_PATH + self._DEFAULT_PLAYLIST, JSON.stringify(playlist, null, 2), {'encoding' : 'utf8'});
    callback();
  },

  launch_video : function(device, data) {
    var self = this;
    var filepath = data.args.filepath;

    self.ffmpeg.get_duration(filepath, function(err, str) {
      if (!err) {
        var time    = str.split('.')[0].replace('Duration: ', ''),
            hours   = parseInt(time.split(':')[0]),
            minutes = parseInt(time.split(':')[1]),
            seconds = parseInt(time.split(':')[2]),
            total   = seconds + (60 * minutes) + (3600 * hours);

        self.server.broadcast('base', 'launch_video', {filepath : filepath});
        device.respond(data, {total_time : total});
      }
    });
  },

  send_playlist : function(device, data) {
    var self = this,
        playlist = JSON.parse(fs.readFileSync(self._PLAYLISTS_PATH + self._DEFAULT_PLAYLIST, 'utf8')),
        dom = "";

    for (var i = 0; i < playlist.videos.length; i++) {
      var filename = playlist.videos[i].replace(self._OUTPUT_PATH, '');
      filename = filename.slice(0, -4);
      dom += '<li class="play_video" rel="' + playlist.videos[i] + '">' + filename + '</li>';
    }
    device.respond(data, {'dom' : dom});
  }
});

module.exports = playlist_broadcaster;
