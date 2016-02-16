//require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks
module.exports = function (grunt) {
    grunt.initConfig({
        watch: {
            react: {
                files: 'js/**/*.js',
                tasks: ['babel', 'uglify', 'requirejs'],
            },
        },
        webpack: {
            options: {
                entry: "js/",
                output: {
                    path: "build/",
                    filename: "bundle.js"
                },
                module: {
                    loaders: [
                        {test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"}
                    ]
                },
            },
        },
        requirejs: {
            app: {
                options: {
                    findNestedDependencies: true,
                    mainConfigFile: 'requirejs.config.js',
                    baseUrl: 'build/',
                    name: 'playlistmessage',
                    out: 'build/playlistmessage-require.js',
                    optimize: 'none',
                }
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
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-webpack');
    grunt.registerTask('default', ['babel']);
    grunt.registerTask('require', ['requirejs']);
};
