var cp       = require('child_process'),
    Class    = require('uclass'),
    Options  = require('uclass/options'),
    chokidar = require('chokidar'),
    fs       = require('fs');

var Ffmpeg = new Class({

  Implements : [Options],

  Binds : ['delete_file', 'encrypt'],

  ID : 'Ffmpeg',
  options : {},

  is_encrypting     : false,

  initialize : function(options, server) {
    var self = this;

    self.httpServer = server;
    self.setOptions(options);

  },

  start : function(app) {
    var self = this;
    self.watch_incomming();
  },

  watch_incomming : function() {
    var self = this;


    self.incomings = [];

    chokidar.watch(self.options._INCOMING_PATH, {ignored: /[\/\\]\./}).on('all', function(event, filepath){
      console.log(event, filepath);
      switch (event) {
        case 'change' :
          self.incomings.push(filepath);
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

    var encode = self.ffmpeg.encode(self.incomings[0], self.options._OUTPUT_PATH + output_file, function(exit_code) {
      if (exit_code != 0)
        console.log('An error occured while encrypting file : ' + self.incomings[0]);
      self.incomings = (self.incomings[1]) ? slice(self.incomings, 1) : [];

      self.push_incomming_playlist(output_file, function(md5) {
        self.httpServer.broadcast('base', 'incomming_video', {'playlist_path' : self.options._OUTPUT_PATH, 'filename' : output_file});
        self.is_encrypting = false;
        self.scan_incommings();
      });
    });
  },

  push_incomming_playlist : function(output_file, callback) {
    var self = this,
        playlist = JSON.parse(fs.readFileSync(self.options._OUTPUT_PATH + self.options._PLAYLIST_NAME, 'utf8')),
        md5 = md5File(self.options._OUTPUT_PATH + output_file);

    if (playlist.videos[md5])
      delete playlist.videos[md5];

    playlist.videos[md5] = {
      'path'      : self.options._OUTPUT_PATH + output_file,
      'real_name' : output_file
    };

    fs.writeFileSync(self.options._OUTPUT_PATH + self.options._PLAYLIST_NAME, JSON.stringify(playlist, null, 2), {'encoding' : 'utf8'});
    callback(md5);
  },

  encode : function(input_file, output_path, callback) {
    var self = this;

    self.input_file = input_file;
    self.output_path = output_path;
    self.callback = callback;

    fs.exists(output_path, function (exists) {
      (exists ? self.delete_file() : self.encrypt());
    });

  },

  delete_file : function() {
    var self = this;
    console.log('delete encrypted file and rebuild it... [' + self.output_path + ']');
    fs.unlinkSync(self.output_path);
    self.encrypt();
  },

  encrypt : function() {
    var self = this;

    console.log('Start converting file ' + self.input_file + '...');
    var args = [
      '-i',
      self.input_file, //.avi
      '-c:v',
      'h264',
      '-ac',
      '2',
      '-t',
      '15',
      self.output_path
    ];

    var cmd = cp.spawn(self.options._EXEC, args, {
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore']
    });

    cmd.on('error', function (err) {
      console.log('Failed to start child process. ' + err);
    });

    cmd.on('close', function (code) {
      console.log('child process exited with code ' + code);
      if (code == 0)
        fs.unlink(self.input_file);
      self.callback(code);
    });
  },

  get_duration : function(filepath, callback) {
    var self = this,
        child = cp.exec(self.options._EXEC + " -i " + filepath + " 2>&1 | grep Duration", function (err, stdout, stderr) {
          if (err !== null) {
            callback(err, false);
          }
          callback(null, stdout);
        });
  }
});

module.exports = Ffmpeg
