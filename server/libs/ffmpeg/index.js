var cp    = require('child_process'),
    Class = require('uclass'),
    fs    = require('fs');

var ffmpeg = new Class({

  Binds : ['delete_file', 'encrypt'],

  _EXEC : "ffmpeg",

  initialize : function() {

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
      'libx264',
      '-crf',
      '25',
      '-preset',
      'slow',
      '-c:a',
      'aac',
      '-strict',
      'experimental',
      '-b:a',
      '192k',
      '-ac',
      '2',
      self.output_path
    ];

    var cmd = cp.spawn(self._EXEC, args);

    cmd.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
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
        child = cp.exec(self._EXEC + " -i " + filepath + " 2>&1 | grep Duration", function (err, stdout, stderr) {
          if (err !== null) {
            callback(err, false);
          }
          callback(null, stdout);
        });
  }
});

module.exports = ffmpeg
