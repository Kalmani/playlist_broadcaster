var Server   = require('ubk_v2/server'),
    Class    = require('uclass'),
    Options  = require('uclass/options'),
    guid     = require('mout/random/guid'),
    slice    = require('mout/array/slice'),
    path     = require('path'),
    fs       = require('fs'),
    md5File  = require('md5-file');

var Broadcaster = new Class({

  Implements : [Options],

  Binds : ['scan_incommings'],

  ID : 'Broadcaster',
  options : {},


  devices : {},

  initialize : function(options, server) {
    var self = this;
    self.httpServer = server;
    self.setOptions(options);
  },

  start : function(app) {
    var self = this;

    self.ffmpeg = app.modules['Ffmpeg'];
    self.launch();
  },

  launch : function() {
    var self = this;

    self.server = new Server();

    self.server.on('base:registered_client', function(device){
      self.devices[device.client_key] = self.server.get_client(device.client_key);
      console.log('DEVICE IS  : ' + self.devices[device.client_key]);
    });

    self.broadcaster();

    self.server.start_socket_server(this.httpServer , "/");
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

    self.server.register_cmd('base', 'send_current_time', function(device, data) {
      self.server.broadcast('base', 'send_current_time', {current_time : data.args.current_time});
    });

    self.server.register_cmd('base', 'go_to', function(device, data) {
      self.server.broadcast('base', 'send_cmd', {go_to : data.args.current_time});
    })
  },

  ask_childrens : function(device, data) {
    console.log('data is');
    console.log(data.args.filepath);
  },

  launch_video : function(device, data) {
    var self = this;
    var video_path = data.args.path;

    self.ffmpeg.get_duration(video_path, function(err, str) {
      if (!err) {
        var time    = str.split('.')[0].replace('Duration: ', ''),
            hours   = parseInt(time.split(':')[0]),
            minutes = parseInt(time.split(':')[1]),
            seconds = parseInt(time.split(':')[2]),
            total   = seconds + (60 * minutes) + (3600 * hours);

        self.server.broadcast('base', 'launch_video', {path : video_path});
        device.respond(data, {total_time : total});
      }
    });
  },

  send_playlist_list : function(device, data) {
    var self = this,
        playlist_path = (data.args.path || self.options._ROOT_PATH),
        playlist_list = fs.readdirSync(playlist_path),
        result = {
          'playlists' : [],
          'videos'    : []
        };
    if (playlist_path !== self.options._ROOT_PATH) {
      var path_array = playlist_path.split('/');
      result.playlists.push({'playlist_path' : path_array.slice(0, -1).join('/'), 'name' : 'retour', 'back' : 'true'});
    }

    for (var i = 0; i < playlist_list.length; i++) {
      if (fs.lstatSync(playlist_path + '/' + playlist_list[i]).isDirectory())
        result.playlists.push(self.sub_playlist(playlist_path + '/' + playlist_list[i]));
    }
    try {
      var current_playlist = JSON.parse(fs.readFileSync(playlist_path + '/' + self.options._PLAYLIST_NAME, 'utf8'));
      Object.each(current_playlist.videos, function(video_data, key) {
        result.videos.push(self.show_video(key, video_data));
      });
    } catch (e) {
      console.log('no playlist for directory ' + playlist_path);
    }

    device.respond(data, result);
  },

  sub_playlist : function(playlist_path) {
    var self = this,
        playlist_infos = JSON.parse(fs.readFileSync(playlist_path + '/' + self.options._PLAYLIST_NAME, 'utf8'));
    return {'playlist_path' : playlist_path, 'name' : playlist_infos.name};
  },

  show_video : function(key, data) {
    var self = this;
    return {'path' : data.path, 'name' : data.real_name};
  }
});

module.exports = Broadcaster;
