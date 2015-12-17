var cp    = require('child_process'),
    Class = require('uclass'),
    fs    = require('fs');

var ffmpeg = new Class({

  _EXEC : "ffmpeg",

  initialize : function(input_file, output_path, callback) {
    var self = this;
    console.log('Start converting file ' + input_file + '...');
    var args = [
      '-i',
      input_file, //.avi
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
      output_path
    ];

    var cmd = cp.spawn(self._EXEC, args);

    cmd.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
    });

    cmd.on('close', function (code) {
      console.log('child process exited with code ' + code);
      fs.unlink(input_file);
      callback();
    });
  }
});

module.exports = ffmpeg
