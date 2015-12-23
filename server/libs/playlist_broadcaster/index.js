var Server   = require('ubk/server'),
    Class    = require('uclass'),
    chokidar = require('chokidar'),
    ffmpeg   = require('../ffmpeg'),
    guid     = require('mout/random/guid'),
    slice    = require('mout/array/slice'),
    path     = require('path'),
    fs       = require('fs'),
    md5File  = require('md5-file');

var playlist_broadcaster = new Class({

  Binds : ['scan_incommings'],
  
  _INCOMING_PATH    : './incomming',
  _ROOT_PATH        : './outputs/',
  _OUTPUT_PATH      : './outputs/fresh/',
  _PLAYLIST_NAME    : 'playlist.json',

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

    self.server.register_cmd('base', 'ask_playlists', function(device, data) {
      self.send_playlist_list(device, data);
    });

    self.server.register_cmd('base', 'launch_video', function(device, data) {
      self.launch_video(device, data);
    });
  },

  watch_incomming : function() {
    var self = this;


    self.incomings = [];

    chokidar.watch(self._INCOMING_PATH, {ignored: /[\/\\]\./}).on('all', function(event, path){
      console.log(event, path);
      switch (event) {
        case 'change' :
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

      self.push_incomming_playlist(output_file, function(md5) {
        self.server.broadcast('base', 'incomming_video', {'playlist_path' : self._OUTPUT_PATH, 'filename' : output_file});
        self.is_encrypting = false;
        self.scan_incommings();
      });
    });
  },

  push_incomming_playlist : function(output_file, callback) {
    var self = this,
        playlist = JSON.parse(fs.readFileSync(self._OUTPUT_PATH + self._PLAYLIST_NAME, 'utf8')),
        md5 = md5File(self._OUTPUT_PATH + output_file);

    if (playlist.videos[md5])
      delete playlist.videos[md5];

    playlist.videos[md5] = {
      'path'      : self._OUTPUT_PATH + output_file,
      'real_name' : output_file
    };

    fs.writeFileSync(self._OUTPUT_PATH + self._PLAYLIST_NAME, JSON.stringify(playlist, null, 2), {'encoding' : 'utf8'});
    callback(md5);
  },

  ask_childrens : function(device, data) {
    console.log('data is');
    console.log(data.args.filepath);
  },

  launch_video : function(device, data) {
    var self = this;
    var path = data.args.path;

    self.ffmpeg.get_duration(path, function(err, str) {
      if (!err) {
        var time    = str.split('.')[0].replace('Duration: ', ''),
            hours   = parseInt(time.split(':')[0]),
            minutes = parseInt(time.split(':')[1]),
            seconds = parseInt(time.split(':')[2]),
            total   = seconds + (60 * minutes) + (3600 * hours);

        self.server.broadcast('base', 'launch_video', {path : path});
        device.respond(data, {total_time : total});
      }
    });
  },

  send_playlist_list : function(device, data) {
    var self = this,
        path = (data.args.path || self._ROOT_PATH),
        playlist_list = fs.readdirSync(path),
        dom = "";

    for (var i = 0; i < playlist_list.length; i++) {
      if (fs.lstatSync(path + '/' + playlist_list[i]).isDirectory())
        dom += self.sub_playlist(path + '/' + playlist_list[i]);
    }
    try {
      var current_playlist = JSON.parse(fs.readFileSync(path + '/' + self._PLAYLIST_NAME, 'utf8'));
      console.log(current_playlist.videos);
      Object.each(current_playlist.videos, function(video_data, key) {
        console.log(key);
        dom += self.show_video(key, video_data);
      });
    } catch (e) {
      console.log('no playlist for directory ' + path);
    }

    device.respond(data, {'dom' : dom});
  },

  sub_playlist : function(playlist_path) {
    var self = this,
        playlist_infos = JSON.parse(fs.readFileSync(playlist_path + '/' + self._PLAYLIST_NAME, 'utf8'));
    return '<li class="show_playlist" rel="' + playlist_path + '"><i class="fa fa-list"></i> ' + playlist_infos.name + '</li>';
  },

  show_video : function(key, data) {
    var self = this;
    return '<li class="launch_video" rel="' + data.path + '"><i class="fa fa-play"></i> ' + data.real_name + '</li>';
  }
});

module.exports = playlist_broadcaster;
