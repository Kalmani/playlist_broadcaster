var UbkClient  = require('./node_modules/ubk/client/ws'),
    Class      = require('uclass'),
    Events     = require('uclass/events');


var Client_Interface = new Class({

  Binds : ['onconnection', 'ondeconnection'],

  initialize : function() {
    var self = this;

    self.server_url = document.location.hostname;

    self.launch_ubk_client();

  },

  launch_ubk_client : function() {
    self = this;
    self.ubk = new UbkClient('http://' + self.server_url + ':8001');
    self.register_command();
    self.ubk.connect(self.onconnection , self.ondeconnection);
  },

  onconnection : function() {
    self = this;

    self.bind_interface();
    self.ask_video(); // temp
  },

  ondeconnection : function() {
    setTimeout(function() {
      alert("connection lost");
      document.location = document.location.href;
    }, 100);
  },

  register_command : function() {
    var self = this;

    self.ubk.register_cmd('base', 'registered_client', function(data) {
      self.device_key = data.args.client_key;
    });

    self.ubk.register_cmd('base', 'send_cmd', function(data){
      console.log('ici', data);
      if (!data.args)
        return;
      if (data.args.play) {
        document.getElementById('video').play();
      }
      if (data.args.switch) {
        document.getElementById('video').src = "./outputs/input_mpg.mp4";
        document.getElementById('video').play();
      }
      if (data.args.go_to) {
        document.getElementById('video').currentTime = data.args.go_to;
        document.getElementById('video').play();
      }
    });
  },

  bind_interface : function() {
    var self = this;
    var dom = document;
    dom.getElementById('play').addEventListener('click', function() {
      var callback = function() {
            console.log('its ok');
          },
          request = {
            'play' : 'current'
          };
      self.ubk.send('base', 'send_cmd', request, callback);
    });

    dom.getElementById('switch').addEventListener('click', function() {
      var callback = function() {
            console.log('its ok');
          },
          request = {
            'switch' : true
          };
      self.ubk.send('base', 'send_cmd', request, callback);
    });

    dom.getElementById('go_to').addEventListener('click', function() {
      var callback = function() {
            console.log('its ok');
          },
          request = {
            'go_to' : 20
          };
      self.ubk.send('base', 'send_cmd', request, callback);
    });
  },

  ask_video : function() {
    var self = this;
    self.ubk.send('base', 'ask_video', {}, function(data) {
      document.getElementById('video').src = data.filepath;
      document.getElementById('video').play();
    });
  }

});
document.addEventListener('DOMContentLoaded', function(){
  var ui_controller = new Client_Interface();
});