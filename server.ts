import "zone.js/dist/zone-node";
import express from "express";
import { join } from "path";
import * as fs from "fs";
import * as Path from "path";
import * as bodyParser from "body-parser";
import cors from "cors"; //To be able to access our API from an angular application
//import formidable from "formidable"; //to handle the uploaded files https://flaviocopes.com/express-forms-files/
import multer from "multer";
import mongoose from "mongoose";
import parseDomain from "parse-domain";
import { cache } from "./eldeeb/fs";

console.clear();

export interface Obj {
  [key: string]: any;
}
//adding properties from formidable to req param, such as req.fields, req.files
//TS2339: Property 'files' does not exist on type 'Request<ParamsDictionary, any, any>'.
export interface Request extends Obj {}

// Express server
const app = express();

const DIST_FOLDER = join(process.cwd(), "./dist/browser"); //process.cwd() dosen't include /dist

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP,
  ngExpressEngine,
  provideModuleMap
} = require("./dist/server/main");

//todo: id (ObjectId | shortId) | limit (number)
function getData(type: string, id) {
  return cache(
    `./temp/${type}/${id || "index"}.json`,
    () =>
      connect().then(() => {
        let contentModel = model(type),
          content;
        if (id) content = contentModel.findById(id); //todo:   //id: objectId or shortId
        content = contentModel.find({}, null, { limit: 10 });
        //console.log("content", content);
        return content;
      }),
    id ? 0 : 24 //index must be updated every 3hrs (even if it removed on update), item may be remain forever
  );
}

function saveData(type: string, data) {
  //console.log("saveData", data);

  return connect().then(
    () => {
      if (data) {
        //console.log("connected");
        let contentModel = model(type);
        let content = new contentModel(data);
        return content.save();
      }
    },
    err => console.error({ err })
  );
}

const json = {
  get(type: string, id?: string | Number) {
    let file = `./temp/${type}/${id || "index"}.json`;
    try {
      return JSON.parse(fs.readFileSync(file).toString() || null);
    } catch (e) {
      console.warn(`json.get(${type},${id}) failed`, e);
    }
  },
  save(type: string, data) {
    if (data) {
      let dir = `./temp/${type}`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (data instanceof Array)
        fs.writeFileSync(`${dir}/index.json`, JSON.stringify(data));
      else fs.writeFileSync(`${dir}/${data._id}.json`, JSON.stringify(data));
    }
  }
};

let db;
function encode(str: string) {
  return encodeURIComponent(str);
}
function connect() {
  if (!db) {
    console.log("connecting...", { mode: process.env.NODE_ENV });
    let dbName = process.env.NODE_ENV == "production" ? "almogtama3" : "test";
    let url = `mongodb+srv://${encode("xxyyzz2050")}:${encode(
      "Xx159753@@"
    )}@almogtama3-gbdqa.gcp.mongodb.net/${dbName}?retryWrites=true&w=majority`;
    db = mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  return db;
}

function model(type) {
  //console.log("model: " +{ type, models: mongoose.models, modelNames: mongoose.modelNames() });
  if (mongoose.models[type]) return mongoose.models[type];
  var contentObj = {
    title: String,
    subtitle: String,
    content: String,
    keywoards: String,
    date: { type: Date, default: Date.now }
  };
  if (type == "jobs")
    contentObj = { ...contentObj, contacts: String } as typeof contentObj; //https://stackoverflow.com/a/31816062/12577650 & https://github.com/microsoft/TypeScript/issues/18075
  let contentSchema = new mongoose.Schema(contentObj);
  let contentModel = mongoose.model(type, contentSchema);
  return contentModel;
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

//to use req.protocol in case of using a proxy in between (ex: cloudflare, heroku, ..), without it express may always returns req.protocole="https" even if GET/ https://***
//https://stackoverflow.com/a/46475726
app.enable("trust proxy");

app.use((req, res, next) => {
  //redirect http -> https & naked -> www
  let parts = parseDomain(req.hostname);
  //ex: www.example.com.eg -> {domain:example, subdomain:www, tld:.com.eg}
  //if the url cannot parsed (ex: http://localhost), parts= null, so we just skip to the next() middliware

  if (parts && (!parts.subdomain || !req.secure)) {
    let url = `https://${parts.subdomain || "www"}.${parts.domain}.${
      parts.tld
    }${req.url}`;
    /*console.log(`redirecting to: ${url}`, {
      host: req.hostname,
      secure: req.secure,
      protocol: req.protocol,
      subdomain: parts.subdomain,
      url: req.url
    });
    */
    return res.redirect(301, url);
  }
  next();
});
app.use(bodyParser.json());
app.use(cors());

//add trailing slash to all requests,
//https://expressjs.com/en/guide/using-middleware.html
//https://dev.to/splodingsocks/getting-all-404s-with-your-firebase-functions-3p1

app.use((req, res, next) => {
  if (!req.path) req.url = `/{req.url}`;
  next();
});
/*
 cors default options:
 {
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
}

 */

//multer hanles multipart/form-data ONLY, make sure to add enctype="multipart/form-data" to <form>
//todo: add multer to specific urls: app.post(url,multer,(req,res)=>{})
app.use(
  multer({
    fileSize: 5 * 1024 * 1024,
    files: 20,
    fileFilter: function(req, file, cb) {
      //console.log("multer", { req, file, cb });
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
  //console.log("server post", { body: req.body });
  saveData(req.params.type, req.body).then(
    data => res.send({ ok: true, data }),
    err => res.send({ ok: false, err })
  );
});

app.get("/api/:type/:id?", (req, res, next) => {
  let type = req.params.type,
    id = req.params.id;
  getData(type, id)
    .then(
      payload => res.json({ type: id ? "item" : "list", payload }),
      error => ({ type: error, error }) //todo: content/index.html admin:show error
    )
    .catch(next); //https://expressjs.com/en/advanced/best-practice-performance.html#use-promises
});

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

//app.listen() moved to a separate file `server-start.ts`, because firebase will handle it automatically
//when using this server without firebase, use `node dist/server-start`
export { app }; //for firebase
