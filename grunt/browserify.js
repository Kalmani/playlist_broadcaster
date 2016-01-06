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
        'front/browserified.js': ['front/app/client.js'],
      }
    },

    pack_manager : {
      files: {
        'server/manager/browserified.js': ['server/manager/app/admin.js'],
      }
    }
  });


  grunt.registerTask('pack', ['browserify']);

  grunt.loadNpmTasks('grunt-browserify');
};