import "zone.js/dist/zone-node";
import express from "express";
import { json as jsonParser, urlencoded as urlParser } from "body-parser";
import cors from "cors"; //To be able to access our API from an angular application
//import formidable from "formidable"; //to handle the uploaded files https://flaviocopes.com/express-forms-files/
import parseDomain from "parse-domain";
import {
  renameSync,
  json,
  mdir,
  existsSync,
  constants,
  parsePath,
  cache
} from "pkg/nodejs-tools/fs";
import shortId from "shortid";
import {
  getData,
  upload,
  saveData,
  bucket,
  BROWSER,
  MEDIA,
  BUCKET,
  dev,
  getCategories
} from "./functions";
import { resize } from "pkg/graphics";
import { setTimer, endTimer, getTimer } from "pkg/nodejs-tools/timer";

//todo: import {} from 'fs/promises' dosen't work yet (expremental)
const { access, readFile, writeFile } = require("fs").promises;

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
  if (dev) console.log("[server] request:", req.originalUrl, { req });
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
    console.log("[server] post", {
      body: req.body,
      files: req.files,
      file: req.file,
      cover: req.body.cover //should be moved to files[] via multer
    });

  if (!req.body || !req.body.content)
    return res.send({ ok: false, msg: "no data posted" });

  if (!req.body._id) req.body._id = shortId.generate();
  req.body.type = req.params.type;
  req.body.file = req.file;
  if (dev) console.log("[server] post", { body: req.body });

  saveData(req.body)
    .then(data => res.send({ ok: true, data }))
    .catch(error => res.send({ ok: false, error }));

  //the content will be available after the process completed (uploading files, inserting to db, ..)
});

app.get("/api/:item?", (req, res, next) => {
  var item = req.params.item;

  //home page (/api/)
  if (!item) category = "articles";
  else if (item.startsWith("~")) {
    if (item == "~categories")
      getCategories()
        .then(data => res.json({ data }))
        .catch(error => res.json({ error }));
    else res.json({ error: { message: `unknown param ${item}` } });
  } else {
    var id, category;
    if (item.startsWith("id-")) id = item.slice(3);
    else category = item;

    if (dev) console.log("[server] get:", { id, category });

    getData({ id, category })
      .then(payload => {
        if (dev) console.log("[server] getData:", payload);
        res.json(payload);
      })
      .catch(error => {
        if (dev) console.log("[server] getData error:", error);
        res.json({ error });
      });
    //or .catch(next)
    //https://expressjs.com/en/advanced/best-practice-performance.html#use-promises
    //https://expressjs.com/en/guide/error-handling.html
  }
});

//todo: /\/(?<type>image|cover)\/(?<id>[^\/]+) https://github.com/expressjs/express/issues/4277
app.get(/\/(image|cover)\/([^\/]+)/, (req, res) => {
  //<img src="/images/$id/slug.png?size=250" />
  setTimer("/image");

  //todo: use system.temp folder
  let type = req.params[0],
    id = req.params[1],
    size = <string>req.query.size,
    path = `articles/${type}/${id}`,
    bucketPath = `${BUCKET}/${path}.webp`,
    localPath = `${MEDIA}/${path}.webp`,
    resizedPath = `${localPath}_${size}.webp`;

  if (!id || !type)
    return res.json({ error: { message: "[server] undefined id or type " } });

  cache(
    resizedPath,
    () =>
      cache(
        localPath,
        () => bucket.download(bucketPath).then(data => data[0]),
        24
      ).then(data =>
        resize(data, size, {
          //  dest: resizedPath, //if the resizid img saved to a file, data=readFile(resized)
          format:
            req.headers.accept.indexOf("image/webp") !== -1 ? "webp" : "jpg",
          allowBiggerDim: false, //todo: add this options to resize()
          allowBiggerSize: false
        })
      ),
    24
  )
    .then(data => {
      console.log({ data });
      //todo: set cache header
      //todo: resize with sharp, convert to webp
      //res.write VS res.send https://stackoverflow.com/a/54874227/12577650
      //res.write VS res.sendFile https://stackoverflow.com/a/44693016/12577650
      //res.writeHead VS res.setHeader https://stackoverflow.com/a/28094490/12577650
      res.writeHead(200, {
        "Content-Type": "image/jpg",
        "Cache-Control": "max-age=31536000"
      });

      res.write(data);
      if (dev) console.log("[server] get /image", endTimer("/image"), path);
      res.end();
    })
    .catch(error => res.json({ error }));
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
    .on("error", error => console.error("express server error:", { error }));
}
