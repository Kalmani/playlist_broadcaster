var UbkClient  = require('../node_modules/ubk/client/ws'),
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
  Binds      : ['onconnection', 'ondeconnection', 'update_progress'],

  templates   : {},
  playing     : null,
  device_type : null,
  _ROOT_PATH  : './outputs',

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

    self.ubk.register_cmd('base', 'incomming_video', function(data) {
      if (self.device_type != 'controler') return;
      self.ask_playlists(data.args.playlist_path, data.args.filename);
    });

    self.ubk.register_cmd('base', 'launch_video', function(data) {
      if (self.device_type != 'screen') return;
      document.getElement('#video').src = data.args.path;
      document.getElement('#video').play();
    });

    self.ubk.register_cmd('base', 'send_cmd', function(data){
      if (!data.args)
        return;
      if (data.args.play !== undefined) {
        if (data.args.play === true) {
          document.getElement('#video').play();
        } else {
          document.getElement('#video').pause();
        }
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
      url : 'front/templates.xml',
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
    dom.inject(document.body.empty());

    dom.getElement('#choose_controler').addEvent('click', function() {
      self.device_type = 'controler';
      var dom = self.render('control_screen');
      dom.inject(document.body.empty());
      self.ask_playlists();
    });

    dom.getElement('#choose_screen').addEvent('click', function() {
      self.device_type = 'screen';
      var dom = self.render('diffusion_screen');
      dom.inject(document.body.empty());
    });
  },

  bind_controls : function(dom) {
    var self = this;
    dom.getElement('#is_pause').addEvent('click', function() {
      self.ubk.send('base', 'send_cmd', {'play' : true}, function() {});
      dom.getElement('#is_pause').setStyle('display', 'none');
      dom.getElement('#is_playing').setStyle('display', 'inline-block');
      //self.progress_timer = setInterval(self.update_progress, 1000);
    });
    dom.getElement('#is_playing').addEvent('click', function() {
      self.ubk.send('base', 'send_cmd', {'play' : false}, function() {});
      dom.getElement('#is_playing').setStyle('display', 'none');
      dom.getElement('#is_pause').setStyle('display', 'inline-block');
      //clearInterval(self.progress_timer);
    });

    /*dom.getElement('#go_to').addEvent('click', function() {
      self.ubk.send('base', 'send_cmd', {'go_to' : 20}, function() {});
    });*/
    /*self.progress_bar = dom.getElement('#progress_time'),
    self.current_time  = 0;
    self.progress_timer = setInterval(self.update_progress, 1000);*/

    dom.getElements('.change').addEvent('click', function() {
      var direction = this.get('rel'),
          current = null,
          videos = document.getElements('.play_video');
      for (var i = 0; i < videos.length; i++) {
        if (videos[i].get('rel') == self.playing)
          current = videos[i];
      }

      if (direction == 'backward') {
        if (current.getPrevious()) {
          $(current.getPrevious()).click();
        } else {
          $(videos[(videos.length - 1)]).click();
        }
      } else {
        if (current.getNext()) {
          $(current.getNext()).click();
        } else {
          $(videos[0]).click();
        }
      }
    });
  },

  update_progress : function() {
    var self = this;
    self.current_time++;

    var purcent = parseInt((100 / self.total_time) * self.current_time);
    self.progress_bar.setStyle('width', purcent + '%');

    if (purcent < 100) return;

    clearInterval(self.progress_timer);


    // USE EVENT STOP ON VIDEO INSTEAD
    var current = null,
        videos = document.getElements('.play_video');
    for (var i = 0; i < videos.length; i++) {
      if (videos[i].get('rel') == self.playing)
        current = videos[i];
    }
    if (current.getNext()) {
      $(current.getNext()).click();
    } else {
      $(videos[0]).click();
    }
  },

  ask_playlists : function(path, pointer) {
    var self = this;

    if (!path)
      path = self._ROOT_PATH;

    self.ubk.send('base', 'ask_playlists', {'path' : path}, function(data) {
      var playlist = document.getElement('#playlists');

      playlist.innerHTML = data.dom;

      if (pointer)
        playlist.getElement('[rel=' + path + pointer + ']').addClass('fresh');

      playlist.getElements('.launch_video').addEvent('click', function() {
        playlist.getElements('.launch_video').removeClass('active');
        this.addClass('active');
        self.launch_video(this.get('rel'));
      });

      playlist.getElements('.show_playlist').addEvent('click', function() {
        playlist.getElements('.show_playlist').removeClass('active');
        this.addClass('active');
        self.ask_playlists(this.get('rel'));
      });
    });
  },

  launch_video : function(path) {
    self.ubk.send('base', 'launch_video', {'path' : path});
  },

  add_control_panel : function() {
    var self = this,
        dom = self.render('actions_list'),
        container = document.getElement('#actions_list').empty();
    dom.inject(container);

    self.bind_controls(dom);
  }

});
document.addEvent('DOMContentLoaded', function(){
  var ui_controller = new Client_Interface();
});