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
        'front/browserified.js': ['front/app/scripts.js'],
      }
    }
  });


  grunt.registerTask('pack', ['browserify']);

  grunt.loadNpmTasks('grunt-browserify');
};