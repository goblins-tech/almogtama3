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

function getData(type: string, id?: string | Number) {
  let data;
  try {
    data = fs.readFileSync(`./data/${type}.json`).toString();
    if (data) data = JSON.parse(data);
    if (!data) return;
    if (id && data instanceof Array) {
      for (let i = 0; i < data.length; i++) {
        if (+data[i]["id"] == +id) return data[i];
      }
    }
  } catch (e) {
    console.warn(`getData() reading ${type}.json faild!`, e);
  }
  return data;
}

function saveData(type: string, data): void {
  if (data) {
    let allData = getData(type);
    if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
    allData.push(data);
    fs.writeFileSync(`./data/${type}.json`, JSON.stringify(allData));
  }
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
//todo: add multer to specific urls: app.post(url,multer,(req,res)=>{})
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
  if (req.body) saveData(req.params.type, req.body);
  res.send({ ok: true }); //todo: update the existing data in html
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
