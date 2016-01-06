module.exports = function(grunt) {

  grunt.config('watch.css', {
      files: ['front/**/*.css', '!front/theme/main.css'],
      tasks: ['cssmin']
  });


  grunt.config('watch.scripts', {
      files: ['front/**/*.js', '!front/browserified.js', '!front/app.js'],
      tasks: ['pack', 'concat:scripts']
  });

  grunt.config('watch.scripts_manager', {
      files: ['server/manager/**/*.js', '!server/manager/browserified.js', '!server/manager/app.js'],
      tasks: ['pack', 'concat:scripts_manager']
  });

  grunt.config('watch.templates', {
      files: ['front/templates/*.xml'],
      tasks: ['concat:templates']
  });


  grunt.loadNpmTasks('grunt-contrib-watch');
};

