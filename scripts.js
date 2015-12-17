var UbkClient  = require('./node_modules/ubk/client/ws'),
    Class      = require('uclass'),
    Events     = require('uclass/events');

var ubk = new UbkClient('http://172.19.21.59:8001');
var ondeconnection = function() {
  setTimeout(function() {
    alert("connection lost");
    document.location = document.location.href;
  }, 100);
};

var onconnection = function(ubk) {
  register_command(ubk);
};

function register_command(ubk) {
  ubk.register_cmd('base', 'send_cmd', function(data){
    console.log('ici', data);
    if (!data.args)
      return;
    if (data.args.play) {
      document.getElementById('video').play();
    }
  });
}

ubk.connect(function() { onconnection(ubk); } , ondeconnection);

document.getElementById('play').addEventListener('click', function() {
  var callback = function() {
        console.log('its ok');
      },
      request = {
        'play' : 'current'
      };
  ubk.send('base', 'send_cmd', request, callback);
});