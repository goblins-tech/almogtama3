//https://developers.cloudflare.com/workers/tooling/wrangler/webpack/

const webpackServer = require("./webpack.server.config.js");

module.exports = Object.assign(webpackServer, {
  target: "webworker",
  mode: "production",
  entry: {
    "cloudflare-workers": "./src/server/cloudflare-workers.js"
  }
});
