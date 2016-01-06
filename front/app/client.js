var UbkClient  = require('ubk_v2/client/ws'),
    Class      = require('uclass'),
    Events     = require('uclass/events'),
    Mustache   = require('mustache');

var Client_Interface = new Class({

  Implements : [Events],
  Binds      : [
    'onconnection', 'ondeconnection',
    'registered_client', 'incomming_video', 'launch_video', 'send_current_time', 'dispatch_cmds',
    'change_video', 'update_progress'
  ],

  templates   : {},
  playing     : null,
  timer       : null,
  device_type : null,
  videoStatus : false,
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
    self.ubk = new UbkClient();
    self.register_command();
    self.ubk.connect(self.onconnection , self.ondeconnection , 'http://' + self.server_url + ':8080');
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

    self.ubk.register_cmd('base', 'registered_client', self.registered_client);

    self.ubk.register_cmd('base', 'incomming_video', self.incomming_video);

    self.ubk.register_cmd('base', 'launch_video', self.launch_video);
    self.ubk.register_cmd('base', 'send_current_time', self.send_current_time);
    self.ubk.register_cmd('base', 'send_cmd', self.dispatch_cmds);
  },

  registered_client : function(data) {
    var self = this;
    self.device_key = data.args.client_key;
  },

  incomming_video : function(data) {
    if (self.device_type != 'controler') return;
    self.ask_playlists(data.args.playlist_path, data.args.filename);
  },

  launch_video : function(data) {
    var self = this;
    console.log('ici', self.device_type);
    if (self.device_type != 'screen') return;
    document.getElement('#video').src = data.args.path;
    document.getElement('#video').play();
    self.videoStatus = 'playing';
    document.getElement('#video').addEventListener('ended',function() {
      clearInterval(self.timer);
      // send last tick
      var current_time = parseInt(document.getElement('#video').currentTime);
      self.ubk.send('base', 'send_current_time', {'current_time' : current_time}, function() {});
    });
    if (self.timer)
      clearInterval(self.timer);
    self.timer = setInterval(function() {
      var current_time = parseInt(document.getElement('#video').currentTime);
      self.ubk.send('base', 'send_current_time', {'current_time' : current_time}, function() {});
    }, 1000);
  },

  send_current_time : function(data) {
    var self = this;
    if (self.device_type != 'controler') return;
    if (!document.getElement('#progress_time')) return;
    var purcent = parseInt((100 / self.total_time) * data.args.current_time);
    document.getElement('#progress_time').setStyle('width', purcent + '%');
  },

  dispatch_cmds : function(data) {
    var self = this;
    if (self.device_type != 'screen') return;
    if (!data.args) return;
    if (data.args.play !== undefined) {
      if (data.args.play === true) {
        document.getElement('#video').play();
        self.videoStatus = 'playing';
      } else {
        document.getElement('#video').pause();
        self.videoStatus = 'pause';
      }
    }
    if (data.args.go_to) {
      document.getElement('#video').currentTime = data.args.go_to;
      document.getElement('#video').play();
      self.videoStatus = 'playing';
    }
  },

  load_templates : function() {
    var self = this;
    new Request({
      url : 'front/templates.xml',
      onSuccess : function(txt, xml) {
        var serializer = new XMLSerializer();

        Array.each(self.xpath(xml, "//script[@type='text/template']"), function(node) {
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
    });
    dom.getElement('#is_playing').addEvent('click', function() {
      self.ubk.send('base', 'send_cmd', {'play' : false}, function() {});
      dom.getElement('#is_playing').setStyle('display', 'none');
      dom.getElement('#is_pause').setStyle('display', 'inline-block');
    });

    $('.progress, #progress_time').click(function(e) {
        var posX = $(this).offset().left, posY = $(this).offset().top;
        var percent_time = (e.pageX - posX) / this.offsetWidth;
        var current_time = parseInt(percent_time * self.total_time);
        self.ubk.send('base', 'go_to', {'current_time' : current_time}, function() {
          // repositionne progress
        });
    });

    dom.getElements('.change').addEvent('click', function() {
      var btn = this;
      self.change_video(btn.get('rel'));
    });
  },

  change_video : function(direction) {
    var self = this,
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
      var playlist = self.render('playlists_list', {'playlists' : data.playlists});

      if (pointer)
        playlist.getElement('[rel=' + path + pointer + ']').addClass('fresh');

      playlist.getElements('.show_playlist').addEvent('click', function() {
        playlist.getElements('.show_playlist').removeClass('active');
        this.addClass('active');
        self.ask_playlists(this.get('rel'));
      });
      playlist.inject(document.getElement('#playlists_container').empty());

      if (data.videos.length == 0)
        return;
      var videos = self.render('videos_list', {'videos' : data.videos});
      videos.getElements('.launch_video').addEvent('click', function() {
        videos.getElements('.launch_video').removeClass('active');
        this.addClass('active');
        self.launch_video_control(this.get('rel'));
      });

      videos.inject(document.getElement('#videos_container').empty());
    });
  },

  launch_video_control : function(path) {
    self.ubk.send('base', 'launch_video', {'path' : path}, function(data) {
      self.add_control_panel(data.total_time);
    });
  },

  add_control_panel : function(total_time) {
    var self = this,
        dom = self.render('actions_list'),
        container = document.getElement('#actions_container').empty();
    self.total_time = total_time;
    dom.inject(container);
    self.bind_controls(dom);
  },

  xpath : function(xml, query, ctx) {
    var out = [],
        result = xml.evaluate(query, ctx || xml, null, XPathResult.ANY_TYPE, null),
        current = result.iterateNext();
    while (current) {
      out.push(current);
      current = result.iterateNext();
    }
    return out;
  }

});
document.addEvent('DOMContentLoaded', function(){
  var ui_controller = new Client_Interface();
});