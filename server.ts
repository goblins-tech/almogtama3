import "zone.js/dist/zone-node";
import express from "express";
import { join } from "path";
import * as fs from "fs";
import * as bodyParser from "body-parser";

// Express server
const app = express();

const PORT = process.env.PORT || 4200;
const DIST_FOLDER = join(process.cwd(), "./browser");

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP,
  ngExpressEngine,
  provideModuleMap
} = require("./server/main");

function getData(type: string, id?: string) {
  console.log("server/getData:", { type, id });
  let data;
  try {
    data = fs.readFileSync(`./data/${type}.json`).toString();
    if (data) data = JSON.parse(data) || {};
    if (id) data = data[0]; //todo:
  } catch (e) {
    console.warn(`getData() reading ${type}.json faild!`, e);
  }
  return data || [];
}

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
app.engine(
  "html",
  ngExpressEngine({
    bootstrap: AppServerModuleNgFactory,
    providers: [provideModuleMap(LAZY_MODULE_MAP)]
  })
);

app.set("view engine", "html");
app.set("views", DIST_FOLDER);
app.use(bodyParser.json());

app.post("/api/:type", (req, res) => {
  console.log("server post()", { type: req.params.type, body: req.body });
  var data = [];
  if (req.body) {
    if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
    data = getData(req.params.type);
    data.push(req.body);
    fs.writeFileSync(`./data/${req.params.type}.json`, JSON.stringify(data));
  }

  res.send(data); //todo: update the existing data in html
});

app.get("/api/:type/:id?", (req, res) => {
  let id = req.params.id;
  res.json({
    type: id ? "item" : "index",
    payload: getData(req.params.type, id)
  });
});

// Example Express Rest API endpoints
// app.get('/api/**', (req, res) => { });
// Serve static files from /browser
app.get(
  "*.*",
  express.static(DIST_FOLDER, {
    maxAge: "1y"
  })
);

// All regular routes use the Universal engine
app.get("*", (req, res) => {
  res.render("index", { req });
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Node Express server listening on http://localhost:${PORT}`);
});

export { app }; //for firebase
