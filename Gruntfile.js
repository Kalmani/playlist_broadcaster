module.exports = function(grunt) {
  var path = require("path"),
      fs = require("fs");

  grunt.initConfig({
    //pkg: require('./package.json'),
    //manifest : (fs.existsSync("./manifest.json") ? require('./manifest.json') : false),
    deploy_dir : grunt.option('deploy_dir') || './',
    absolute_root : path.resolve(__dirname),
  });

  //thx shama
  grunt.file.expand({filter:'isDirectory'}, 'grunt/**').forEach(grunt.loadTasks);
  grunt.log.writeln("Working in '%s'", grunt.config('deploy_dir'));

   // default task is to init dev env
    grunt.registerTask('default', [
      'pack',
    ]);
};
