var UbkClient  = require('./node_modules/ubk/client/ws'),
    Class      = require('uclass'),
    Events     = require('uclass/events'),
    Mustache   = require('mustache');

XMLDocument.prototype.xpath = function(query, ctx) {
  var out = [],
      result = this.evaluate(query, ctx || this, null, XPathResult.ANY_TYPE, null),
      current = result.iterateNext();
  while (current) {
    out.push(current);
    current = result.iterateNext();
  }
  return out;
};


var Client_Interface = new Class({

  Implements : [Events],

  Binds : ['onconnection', 'ondeconnection'],

  templates : {},

  initialize : function() {
    var self = this;

    self.server_url = document.location.hostname;
    self.mustache = Mustache;

    self.launch_ubk_client();
    self.addEvent('init', function() {
      self.build_interface();
    });
  },

  launch_ubk_client : function() {
    self = this;
    self.ubk = new UbkClient('http://' + self.server_url + ':8001');
    self.register_command();
    self.ubk.connect(self.onconnection , self.ondeconnection);
  },

  onconnection : function() {
    self = this;
    self.load_templates();
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

    self.ubk.register_cmd('base', 'launch_video', function(data) {
      document.getElement('#video').src = data.args.filepath;
      document.getElement('#video').play();
    });

    self.ubk.register_cmd('base', 'send_cmd', function(data){
      console.log('ici', data);
      if (!data.args)
        return;
      if (data.args.play) {
        document.getElement('#video').play();
      }
      if (data.args.switch) {
        document.getElement('#video').src = "./outputs/input_mpg.mp4";
        document.getElement('#video').play();
      }
      if (data.args.go_to) {
        document.getElement('#video').currentTime = data.args.go_to;
        document.getElement('#video').play();
      }
    });
  },

  load_templates : function() {
    var self = this;
    new Request({
      url : 'templates.xml',
      onSuccess : function(txt, xml) {
        var serializer = new XMLSerializer();

        Array.each(xml.xpath("//script[@type='text/template']"), function(node) {
          var str = "";
          Array.each(node.childNodes, function(child) {
            str += serializer.serializeToString(child);
          });
          self.templates[node.getAttribute('id')] = str;
        });

        self.fireEvent('init');
      }
    }).get();
  },

  render : function(id, ctx) {
    var self = this;
    var tpl = self.templates[id];
    var dom = self.mustache.render(tpl, ctx || null);
    return new Element('div', {'html' : dom});
  },

  build_interface : function() {
    var self = this;
    var dom = self.render('device_choice');
    dom.inject(document.body);

    dom.getElement('#choose_controler').addEvent('click', function() {
      var dom = self.render('control_screen');
      dom.inject(document.body.empty());
      self.bind_interface();
      self.ask_playlist();
    });

    dom.getElement('#choose_screen').addEvent('click', function() {
      var dom = self.render('diffusion_screen');
      dom.inject(document.body.empty());
    });
  },

  bind_interface : function() {
    var self = this;
    var dom = document;
    dom.getElement('#play').addEvent('click', function() {
      var callback = function() {
            console.log('its ok');
          },
          request = {
            'play' : 'current'
          };
      self.ubk.send('base', 'send_cmd', request, callback);
    });

    dom.getElement('#switch').addEvent('click', function() {
      var callback = function() {
            console.log('its ok');
          },
          request = {
            'switch' : true
          };
      self.ubk.send('base', 'send_cmd', request, callback);
    });

    dom.getElementById('go_to').addEvent('click', function() {
      var callback = function() {
            console.log('its ok');
          },
          request = {
            'go_to' : 20
          };
      self.ubk.send('base', 'send_cmd', request, callback);
    });
  },

  ask_playlist : function() {
    var self = this;
    self.ubk.send('base', 'ask_playlist', {}, function(data) {
      var playlist = document.getElement('#playlists');
      playlist.innerHTML = data.dom;

      playlist.getElements('.play_video').addEvent('click', function() {
        // go through server to prepare control device
        self.ask_video(this.get('rel'));
      });
    });
  },

  ask_video : function(filepath) {
    var self = this;
    self.ubk.send('base', 'ask_video', {filepath : filepath});
    /*, function(data) {
      document.getElement('#video').src = data.filepath;
      document.getElement('#video').play();
    }*/
  }

});
document.addEvent('DOMContentLoaded', function(){
  var ui_controller = new Client_Interface();
});