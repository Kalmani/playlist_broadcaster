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
  console.log('onconnection ?');
  register_command(ubk);
};

ubk.connect(function() { console.log('CONNECTED ?'); onconnection(ubk); } , ondeconnection);

document.getElementById('test').addEventListener('click', function() {
  var callback = function() {
        console.log('its ok');
      },
      request = {
        'its' : 'a trap'
      };
  ubk.send('base', 'send_test', request, callback);
});