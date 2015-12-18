module.exports = function(grunt) {
  var path = require("path"),
      fs = require("fs");

  grunt.initConfig({
    manifest : (fs.existsSync("./manifest.json") ? require('./manifest.json') : false),
    deploy_dir : grunt.option('deploy_dir') || './',
    absolute_root : path.resolve(__dirname),
  });

  grunt.file.expand({filter:'isDirectory'}, 'grunt/**').forEach(grunt.loadTasks);
  grunt.log.writeln("Working in '%s'", grunt.config('deploy_dir'));

  grunt.registerTask('default', [
    'pack',
    'concat',
    'cssmin'
  ]);
};
