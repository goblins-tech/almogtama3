// Work around for https://github.com/angular/angular-cli/issues/7200

const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "none",
  entry: {
    // This is our Express server for Dynamic universal
    server: "./server.ts",
    "server-start": "./server-start.ts"
  },
  externals: {
    "./dist/server/main": 'require("./server/main")'
  },
  target: "node",
  resolve: { extensions: [".ts", ".js"] },
  optimization: {
    minimize: false
  },
  output: {
    // Puts the output at the root of the dist folder
    path: path.join(__dirname, "dist"), //todo: dist/this.mode
    filename: "[name].js",
    library: "",
    libraryTarget: "commonjs-module"
    //fix: setting library & libraryTarget to fix issue: require('./server.js') == undefined
    //https://github.com/webpack/webpack/issues/2030#issuecomment-232886608
    //https://github.com/webpack/webpack/issues/2030#issuecomment-290363910
  },
  module: {
    noParse: /polyfills-.*\.js/,
    rules: [
      { test: /\.ts$/, loader: "ts-loader" },
      {
        // Mark files inside `@angular/core` as using SystemJS style dynamic imports.
        // Removing this will cause deprecation warnings to appear.
        test: /(\\|\/)@angular(\\|\/)core(\\|\/).+\.js$/,
        parser: { system: true }
      }
    ]
  },
  plugins: [
    new webpack.ContextReplacementPlugin(
      // fixes WARNING Critical dependency: the request of a dependency is an expression
      //https://webpack.js.org/plugins/context-replacement-plugin/
      /(.+)?angular(\\|\/)core(.+)?/,
      path.join(__dirname, "src"), // location of your src
      {} // a map of your routes
    ),
    new webpack.ContextReplacementPlugin(
      // fixes WARNING Critical dependency: the request of a dependency is an expression
      /(.+)?express(\\|\/)(.+)?/,
      path.join(__dirname, "src"),
      {}
    )
  ]
};
