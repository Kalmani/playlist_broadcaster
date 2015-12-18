var filter = require('mout/object/filter');


module.exports = function(grunt) {

  var manifest = grunt.config.get('manifest');
  var files = manifest.files;

  grunt.config('concat.scripts', {
    options: {
      separator: ';'
    },
    dest: 'front/app.js',
    src: files,
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
};
