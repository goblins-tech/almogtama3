import "zone.js/dist/zone-node";
import express from "express";
import { join } from "path";
import * as fs from "fs";
import * as Path from "path";
import * as bodyParser from "body-parser";
import cors from "cors"; //To be able to access our API from an angular application
//import formidable from "formidable"; //to handle the uploaded files https://flaviocopes.com/express-forms-files/
import multer from "multer";

export interface Obj {
  [key: string]: any;
}
//adding properties from formidable to req param, such as req.fields, req.files
//TS2339: Property 'files' does not exist on type 'Request<ParamsDictionary, any, any>'.
export interface Request extends Obj {}

// Express server
const app = express();

const PORT = process.env.PORT || 4200;
const DIST_FOLDER = join(process.cwd(), "./dist/browser"); //process.cwd() dosen't include /dist

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP,
  ngExpressEngine,
  provideModuleMap
} = require("./dist/server/main");

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
app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200
  })
);

//multer hanles multipart/form-data ONLY, make sure to add enctype="multipart/form-data" to <form>
app.use(
  multer({
    fileSize: 5 * 1024 * 1024,
    files: 20,
    fileFilter: function(req, file, cb) {
      cb(null, true); //to reject this file cb(null,false) or cb(new error(..))
    },
    storage: multer.diskStorage({
      destination: function(req, file, cb) {
        let dir = `./data/uploads/${req.params.type}`;

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: function(req, file, cb) {
        cb(null, Date.now() + Path.extname(file.originalname)); //todo: $id-$img-alt|post-title-timestamp.$ext
      }
    })
  }).any()
);

/*app.use(
  formidableMiddleware({
    //  uploadDir: './data/uploads/$type',
    multiples: true,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
    maxFieldsSize: 5 * 1024 * 1024 //the amount of memory all fields together (except files)
  })
);*/

app.post("/api/:type", (req, res) => {
  console.log("server post()", {
    type: req.params.type,
    body: req.body,
    files: req.files
  });

  /*
todo: waiting for version 1.2.2   https://github.com/node-formidable/node-formidable/issues/533
  let form = new formidable.IncomingForm(); // new formidable()
  form.multiples = true;
  form.keepExtensions = true;
  form.maxFileSize = 5 * 1024 * 1024;
  form.maxFieldsSize = 5 * 1024 * 1024; //the amount of memory all fields together (except files)
  form.parse(req, (err, fields, files) => {
    //  or using events: form.parse(req).on('file',callback)
    if (err) {
      console.error("formidable error:", err);
      throw err;
    }
    console.log({ files, fields });
    for (let file of Object.entries(files)) {
      console.log({ file });
    }
  }); */

  //without formidable, cannot handle 'file' inputs
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
