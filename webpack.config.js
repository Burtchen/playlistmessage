module.exports = {
    entry: "js/",
    output: {
        path: "build/",
        filename: "bundle.js"
    },
    module: {
        loaders: [
            {test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"}
        ]
    }
};