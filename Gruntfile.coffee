_s = require 'underscore.string'

module.exports = (grunt) ->
  pkg = grunt.file.readJSON('package.json')

  grunt.initConfig

    config:
      filename: pkg.name

    clean:
      dist: ["dist"]
      lib: ["lib"]

    coffee:
      lib:
        expand: true
        cwd:'src'
        src: ['**/*.coffee']
        dest: 'lib'
        ext: '.js'
        options:
          bare:true

    browserify:
      dist:
        files:
          'dist/<%= config.filename %>.js':['lib/<%= config.filename %>.js']
        options:
          transform: ['browserify-shim']
          bundleOptions:
            standalone:_s.camelize(pkg.name)
    uglify:
      dist:
        options:
          mangle: false
        files:
          'dist/<%= config.filename %>.min.js':['dist/<%= config.filename %>.js']

  grunt.loadNpmTasks "grunt-contrib-clean"
  grunt.loadNpmTasks "grunt-contrib-coffee"
  grunt.loadNpmTasks "grunt-contrib-uglify"
  grunt.loadNpmTasks "grunt-browserify"

  grunt.registerTask "default", ["clean", "coffee", "browserify", "uglify"]
