module.exports = function(grunt) {
  grunt.config('cssmin', {
    default: {
      options : {
        noAdvanced : true,
      },
      files: {
       'front/theme/main.css' : ['front/theme/_main.css'],
      }
    }
  } );

  grunt.loadNpmTasks('grunt-contrib-cssmin');
};
