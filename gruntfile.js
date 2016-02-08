//require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks
module.exports = function (grunt) {
    grunt.initConfig({
        watch: {
            react: {
                files: 'js/**/*.js',
                tasks: ['babel', 'uglify'],
            },
        },
        uglify: {
            options: {
                compress: true,
            },
            applib: {
                src: [
                    'build/Song.js',
                    'build/Share.js',
                    'build/Markets.js',
                    'build/Message.js',
                    'build/main.js',
                ],
                dest: 'build/playlistmessage.js',
            },
        },
        babel: {
            options: {
                sourceMap: false,
                presets: ['es2015', 'react'],
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: 'js/',
                    src: [
                        'Song.js',
                        'Share.js',
                        'Markets.js',
                        'Message.js',
                        'main.js',
                    ],
                    dest: 'build/'
                }],
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-babel');
    grunt.registerTask('default', ['babel']);
};
