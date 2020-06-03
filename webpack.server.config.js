// Work around for https://github.com/angular/angular-cli/issues/7200

const path = require("path");
const webpack = require("webpack");

module.exports = {
  target: "node",
  mode: "none",
  entry: {
    express: "./src/server/express.ts"
  },
  externals: {
    "./dist/server/main": 'require("./main")',
    sharp: "commonjs sharp" //https://github.com/lovell/sharp/issues/794#issuecomment-306555683
  },
  //https://github.com/googleapis/gax-nodejs/issues/719#issuecomment-605250814
  resolve: {
    extensions: [".ts", ".js", ".json"],
    alias: { pkg: path.resolve(__dirname, "./packages") }
  },
  optimization: {
    minimize: false
  },
  output: {
    // Puts the output at the root of the dist folder
    path: path.join(__dirname, "dist/server"), //todo: `dist/${this.mode}`
    filename: "[name].js", //'[name]' = entry[$key]
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
      },
      {
        //load .node files
        //ex: ./node_modules/sharp/build/Release/sharp.node
        // https://github.com/lovell/sharp/issues/794#issuecomment-307188099
        test: /\.node$/,
        use: "node-loader"
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
