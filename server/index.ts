import "zone.js/dist/zone-node";
import express from "express";
import { json as jsonParser, urlencoded as urlParser } from "body-parser";
import cors from "cors"; //To be able to access our API from an angular application
//import formidable from "formidable"; //to handle the uploaded files https://flaviocopes.com/express-forms-files/
import parseDomain from "parse-domain";
import { renameSync, json, mdir, existsSync } from "../eldeeb/fs";
import shortId from "shortid";
import {
  getData,
  upload,
  saveData,
  BROWSER,
  MEDIA,
  BUCKET,
  dev,
  categories
} from "./functions";

//console.clear();

export interface Obj {
  [key: string]: any;
}
//adding properties from formidable to req param, such as req.fields, req.files
//TS2339: Property 'files' does not exist on type 'Request<ParamsDictionary, any, any>'.
export interface Request extends Obj {}

// Express server
const app = express();

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP,
  ngExpressEngine,
  provideModuleMap
} = require("./dist/server/main");

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
app.engine(
  "html",
  ngExpressEngine({
    bootstrap: AppServerModuleNgFactory,
    providers: [provideModuleMap(LAZY_MODULE_MAP)]
  })
);

app.set("view engine", "html");
app.set("views", BROWSER);

//to use req.protocol in case of using a proxy in between (ex: cloudflare, heroku, ..), without it express may always returns req.protocole="https" even if GET/ https://***
//https://stackoverflow.com/a/46475726
app.enable("trust proxy");

//add trailing slash to all requests,
//https://expressjs.com/en/guide/using-middleware.html
//https://dev.to/splodingsocks/getting-all-404s-with-your-firebase-functions-3p1

app.use((req, res, next) => {
  if (!req.path) req.url = `/{req.url}`;
  next();
});

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

app.use(jsonParser());
app.use(urlParser({ extended: true }));
app.use(cors());

/*
 cors default options:
 {
  "origin": "*",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": false,
  "optionsSuccessStatus": 204
}

 */

/*app.use(
  formidableMiddleware({
    //  uploadDir: './data/uploads/$type',
    multiples: true,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024,
    maxFieldsSize: 5 * 1024 * 1024 //the amount of memory all fields together (except files)
  })
);*/

//todo: typescript: add files[] to `req` definition
//todo: cover= only one img -> upload.single()
app.post("/api/:type", upload.single("cover"), (req: any, res) => {
  if (dev)
    console.log("server post", {
      body: req.body,
      files: req.files,
      file: req.file,
      cover: req.body.cover //should be moved to files[] via multer
    });

  if (!req.body || !req.body.content)
    return res.send({ ok: false, msg: "no data posted" });

  //we can resume this process at any time
  //todo: a process to check if there is any item in the queue
  let id;
  if (!req.body._id) {
    id = shortId.generate();
    req.body._id = id;
  }
  let dir = `./temp/queue/${id}`;
  req.body.type = req.params.type;
  req.body.file = req.file;
  mdir(dir);
  json.write(`${dir}/data.json`, req.body);

  if (dev) console.log("req.body:", req.body);
  saveData(req.body)
    .then(data => res.send({ ok: true, data }))
    .catch(error => res.send({ ok: false, error }));

  //the content will be available after the process completed (uploading files, inserting to db, ..)
});

app.get("/api/:item?", (req, res, next) => {
  if (dev) console.log("req.params:", req.params);

  var item = req.params.item;

  //home page (/api/)
  if (!item) category = "articles";
  else if (item.startsWith("~")) {
    if (item == "~categories")
      categories().then(data => res.send({ ok: true, data }));
    else res.send({ ok: false, msg: `unknown param ${item}` });
  } else {
    var id, category;
    if (item.startsWith("id-")) id = item.slice(3);
    else category = item;

    if (dev) console.log("app.get", { id, category });

    getData({ id, category })
      .then(
        payload => {
          if (dev) console.log({ payload });
          if (typeof payload == "string") payload = JSON.parse(payload);
          res.json({ ok: true, type: id ? "item" : "list", payload });
        },
        error => ({ ok: false, error }) //todo: content/index.html admin:show error
      )
      .catch(next); //https://expressjs.com/en/advanced/best-practice-performance.html#use-promises
  }
});

// Serve static files; /file.ext will be served from /dist/browser/file.ext then /data/media/file.ext
app.get("*.*", express.static(BROWSER, { maxAge: "1y" })); //static assets i.e: created at build time; may be deleted at any time and recreated at build time
app.get("*.*", express.static(MEDIA, { maxAge: "1y" })); //data files i.e: created at runtime via API calls

// All regular routes use the Universal engine
app.get("*", (req, res) => {
  res.render("index", { req });
});

//app.listen() moved to a separate file `server-start.ts`, because firebase will handle it automatically
//when using this server without firebase, use `node dist/server-start`
export { app, express }; //for firebase

// Start up the Node server
//firebase starts the server automatically, so we don't need to start it again (error)
//todo: onError, try port++

if (process.argv[2] == "--start") {
  let PORT = process.env.PORT || 4200;
  app
    .listen(PORT, () => {
      console.log(`Node Express server listening on port:${PORT}`); //,{server}
    })
    .on("error", error => console.warn("express server error:", { error }));
}
