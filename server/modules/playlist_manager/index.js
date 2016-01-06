var Class                = require('uclass'),
    Events               = require('uclass/events'),
    
Manager = new Class({

  Implements : [Events],

  ID : 'Playlist_manager',
  options : {},

  initialize : function() {
    var self = this;
  },

  start : function(app) {

  }
});

module.exports = Manager;
