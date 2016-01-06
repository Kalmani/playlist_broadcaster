var UbkClient = require('ubk_v2/client/ws'),
    Class     = require('uclass'),
    Events    = require('uclass/events'),
    Mustache  = require('mustache'),

Admin_Interface = new Class({

  Implements : [Events],

  Binds      : [
    'onconnection', 'ondeconnection',
  ],

  templates   : {},

  initialize : function() {
    var self = this;

    self.server_url = document.location.hostname;
    self.mustache = Mustache;

    self.launch_ubk_client();
    self.addEvent('init', function() {
      //self.build_interface();
    });
  },


  // COMMON WITH FRONT => MERGE THEM
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

  load_templates : function() {
    var self = this;
    new Request({
      url : '../front/templates.xml',
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

  xpath : function(xml, query, ctx) {
    var out = [],
        result = xml.evaluate(query, ctx || xml, null, XPathResult.ANY_TYPE, null),
        current = result.iterateNext();
    while (current) {
      out.push(current);
      current = result.iterateNext();
    }
    return out;
  },
  ////////

  register_command : function() {

  }
});

document.addEvent('DOMContentLoaded', function(){
  var ui_controller = new Admin_Interface();
});
