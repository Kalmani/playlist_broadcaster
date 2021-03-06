var DOMParser = require("xmldom").DOMParser;

var toArray = function(nodelist) {
  var nodearray = [];
  for(var i=0;i<nodelist.length ; i++)
    nodearray.push(nodelist[i]);
  return nodearray;
}

module.exports = function(grunt) {
  grunt.config('concat.templates', {
    dest:'front/templates.xml',
    src: [ 'front/templates/**/*.xml'],
    options: {
      separator: '',
      banner:"<?xml version='1.0' encoding='UTF-8'?>\n<mustache>",
      footer:"\n</mustache>",
      process:function(src, filepath){

        var content = '', xmlDoc = new DOMParser().parseFromString(src);
        if(xmlDoc.documentElement.tagName != 'mustache')
          return content;

        toArray(xmlDoc.documentElement.childNodes).forEach(function(i) {
          content += i.toString();
        });
        return content;
      },
    },
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
};

