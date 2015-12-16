var fs = require('fs');
var cp = require('child_process');

module.exports = function(grunt) {

  grunt.config('browserify', {
    options : {

      browserifyOptions : {
        transform : false,
//        builtins      : false,
      },
    },

    pack : {
      files: {
        'scripts_compiled.js': ['scripts.js'],
      }
    }
  });


  grunt.registerTask('pack', ['browserify']);

  grunt.loadNpmTasks('grunt-browserify');
};