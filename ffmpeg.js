var cp = require('child_process');

var exec = "ffmpeg";

var args = [
  '-i',
  'input.mpg', //.avi
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
  'out.mp4'
];

var cmd = cp.spawn(exec, args);

cmd.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

cmd.on('close', function (code) {
  console.log('child process exited with code ' + code);
});