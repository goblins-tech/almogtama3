// Work around for https://github.com/angular/angular-cli/issues/7200

const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = (config, options) => {
  //console.log({ webpackConfig: config });

  config.mode = "none";
  config.entry = { express: "./src/server/express.ts" };

  //execlude node_modules from bundling, use require(package) instead.
  config.externals.push(nodeExternals());
  config.resolve.alias.pkg = path.resolve(__dirname, "./packages");

  //fix: setting library & libraryTarget to fix issue: require('./server.js') == undefined
  //https://github.com/webpack/webpack/issues/2030#issuecomment-232886608
  //https://github.com/webpack/webpack/issues/2030#issuecomment-290363910
  //todo: libraryTarget commonjs VS commonjs-module
  config.output.library = "";
  config.output.libraryTarget = "commonjs-module";
  config.module.rules.push(
    { test: /\.ts$/, loader: "ts-loader" },
    {
      //load .node files
      //ex: ./node_modules/sharp/build/Release/sharp.node
      // https://github.com/lovell/sharp/issues/794#issuecomment-307188099
      test: /\.node$/,
      use: "node-loader"
    }
  );

  //optimization: {minimize: false},
  //module.noParse: /polyfills-.*\.js/,
  return config;
};
