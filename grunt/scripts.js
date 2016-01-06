var filter = require('mout/object/filter');


module.exports = function(grunt) {

  var manifest = grunt.config.get('manifest');
  var files = manifest.files;
  var files_manager = manifest.files_manager;

  grunt.config('concat.scripts', {
    options: {
      separator: ';'
    },
    dest: 'front/app.js',
    src: files,
  });

  grunt.config('concat.scripts_manager', {
    options: {
      separator: ';'
    },
    dest: 'server/manager/app.js',
    src: files_manager,
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
};
