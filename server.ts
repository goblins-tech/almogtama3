import "zone.js/dist/zone-node";
import express from "express";
import * as bodyParser from "body-parser";
import cors from "cors"; //To be able to access our API from an angular application
//import formidable from "formidable"; //to handle the uploaded files https://flaviocopes.com/express-forms-files/
import multer from "multer";
import mongoose from "mongoose";
import parseDomain from "parse-domain";
import {
  cache,
  mdir,
  ext,
  rename,
  renameSync,
  readFileSync,
  writeFileSync,
  existsSync,
  unlink,
  readdir,
  join,
  resolve,
  writeFile,
  json
} from "./eldeeb/fs";
import { slug } from "./src/app/content/functions";
import shortId from "shortid";
import { Firebase } from "./eldeeb/firebase-admin";
import * as admin from "firebase-admin";

//console.clear();
const dev = process.env.NODE_ENV === "development";

//todo: use env:GOOGLE_APPLICATION_CREDENTIALS=Path.resolve("./firebase-almogtama3-eg.json")

admin.initializeApp({
  credential: admin.credential.cert(require("./firebase-almogtama3-eg.json")),
  storageBucket: `gs://almogtama3-eg.appspot.com`
});

const bucket = new Firebase(/*{
  project: "almogtama3-eg",
  cert: require("./firebase-almogtama3-eg.json")
}*/).storage();

/*
bucket
  .upload(resolve("./notes.txt"))
  .then(x => console.log("uploaded"), err => console.error(err));
  /*

/**
 * upload to firebase storage
 * @method upload
 * @param  file   file path ex: ./file.txt
 * @return Promise
 */

export interface Obj {
  [key: string]: any;
}
//adding properties from formidable to req param, such as req.fields, req.files
//TS2339: Property 'files' does not exist on type 'Request<ParamsDictionary, any, any>'.
export interface Request extends Obj {}

// Express server
const app = express();

const DIST = join(process.cwd(), "./dist/browser"); //process.cwd() dosen't include /dist
const MEDIA = join(process.cwd(), "./temp/media"); //don't save media files inside dist, as dist may be deleted at any time
const BUCKET = "almogtama3.com/media"; //todo: $config.domain/media
// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP,
  ngExpressEngine,
  provideModuleMap
} = require("./dist/server/main");

//todo: id (ObjectId | shortId) | limit (number)
function getData(params) {
  //console.log("getData", { type, id });
  var cacheFile = "./temp/articles/";
  if (params.id) cacheFile += `/${params.id}`;
  else if (params.category) cacheFile += `/${params.category}`;
  else cacheFile += "index";

  cacheFile += ".json";

  let idx = "_id shortId title slug cover content"; //todo: summary

  return cache(
    cacheFile,
    () =>
      connect()
        .then(() => {
          let contentModel = model("articles"), //todo: model(type)
            content;
          //  console.log("getData.cache()", { type, id });

          if (params.id) {
            if (params.id.length == 24)
              content = contentModel.findById(params.id);
            else
              content = contentModel.find({ shortId: params.id }, null, {
                limit: 1
              }); //note that the returned result is an array, not object
          }
          if (!params.category)
            content = contentModel.find({}, idx, { limit: 50 });
          else {
            content = Promise.all([
              cache(
                `temp/articles/categories.json`,
                () => model("categories").find({}),
                3
              ),
              cache(
                `temp/articles/article_categories.json`,
                () => model("article_categories").find({}),
                1
              )
            ]).then(([categories, article_categories]) => {
              console.log({ categories, article_categories });
              //get category._id from category.slug
              let category = categories.find(el => el.slug == params.category);
              if (dev) console.log("category", category);

              if (category) {
                //get articles from article_categories where category=category._id
                let selectedArticles = [];

                article_categories.forEach(el => {
                  if (el.category == category._id)
                    selectedArticles.push(el.article);
                });

                if (dev) console.log({ selectedArticles });

                //get articles from 'articles' where _id in selectedArticles[]
                let articles = model("articles").find(
                  { _id: { $in: selectedArticles } },
                  idx, //todo: {shortid,title,slug,summary|content}
                  {
                    limit: params.limit || 50,
                    sort: { _id: -1 }
                  }
                );

                //  if (dev)  articles.then(result => console.log("articles", result));
                return articles;
              }
            });
          }

          //console.log("content", content);
          return content;
        })
        .then(content =>
          params.id && params.id.length != 24 && content instanceof Array
            ? content[0]
            : content
        ),
    params.id ? 0 : 24 //index must be updated periodly (even if it removed on update), item may be remain forever
  );
}

function insertData(data) {
  console.log("insertData", data);
  let type = data.type || "article";
  return connect().then(
    () => {
      console.log("connected");
      if (data) {
        //  data.shortId = shortId.generate();
        let contentModel = model(type);
        let content = new contentModel(data);
        return content.save();
      }
    },
    err => console.error("connection failed", { err })
  );
}

const jsonData = {
  get(type: string, id?: string | Number) {
    let file = `./temp/${type}/${id || "index"}.json`;
    try {
      return json.read(file);
    } catch (e) {
      console.warn(`jsonData.get(${type},${id}) failed`, e);
    }
  },
  save(type: string, data) {
    if (data) {
      let dir = `./temp/${type}`;
      mdir(dir);
      if (data instanceof Array) json.write(`${dir}/index.json`, data);
      else json.write(`${dir}/${data.shortId || data._id}.json`, data);
    }
  }
};

let db;
function encode(str: string) {
  return encodeURIComponent(str);
}
//todo: use eldeeb.mongoose
function connect() {
  if (!db) {
    console.log("connecting...", { mode: process.env.NODE_ENV });
    let dbName = process.env.NODE_ENV == "production" ? "almogtama3" : "test";
    let url = `mongodb+srv://${encode("xxyyzz2050")}:${encode(
      "Xx159753@@"
    )}@almogtama3-gbdqa.gcp.mongodb.net/${dbName}?retryWrites=true&w=majority`;

    if (dev) console.log({ url });
    db = mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }

  return db;
}

function model(type) {
  //console.log("model: " +{ type, models: mongoose.models, modelNames: mongoose.modelNames() });
  //todo: schemas/mongoose.ts
  if (mongoose.models[type]) return mongoose.models[type];
  let schemas = {
    basic: {},
    categories: {
      title: String,
      slug: String,
      config: {}
    },
    article_categories: {},
    articles: {
      title: String,
      subtitle: String,
      content: String,
      keywoards: String,
      date: { type: Date, default: Date.now },
      contacts: String //for jobs
      //todo: other properties;
    }
  };

  let schemaObj = type in schemas ? schemas[type] : schemas["basic"];
  let schema = new mongoose.Schema(schemaObj, { strict: false });
  return mongoose.model(type, schema);
  /*
  jobsSchema = { ...schemas["article"], contacts: String } as typeof contentObj;
  //https://stackoverflow.com/a/31816062/12577650 & https://github.com/microsoft/TypeScript/issues/18075
 */
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
app.set("views", DIST);

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
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

//multer hanles multipart/form-data ONLY, make sure to add enctype="multipart/form-data" to <form>
//todo: add multer to specific urls: app.post(url,multer,(req,res)=>{})
//todo: if(error)res.json(error)
//todo: fn upload(options){return merge(options,defaultOptions)}
let upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
    fieldSize: 10 * 1024 * 1024, //form total size; formData[content] contains some images (base64 encoded)
    files: 20
  },
  fileFilter: function(req, file, cb) {
    let result = file.mimetype.startsWith("image/");
    if (dev) console.log("multer fileFilter", { result, req, file, cb });
    cb(null, result); //to reject this file cb(null,false) or cb(new error(..))
  },
  //multer uses memoryStorage by default
  //diskStorage saves the uploaded file to the default temp dir,
  //but rename(c:/oldPath, d:/newPath) not allowed,
  //so we upload the file to a temporary dir inside the same partition
  //https://stackoverflow.com/a/43206506/12577650
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      let dir = "./temp/uploads";
      mdir(dir);
      cb(null, dir);
    },
    filename: function(req, file, cb) {
      cb(null, `tmp${new Date().getTime()}.tmp`);
    }
  })
});

function saveData(sid, data?) {
  if (dev) console.log("====saveData====");
  let dataDir = `./data/queue/${sid}`,
    dataFile = `${dataDir}/data.json`;

  if (!data) {
    if (!existsSync(dataFile)) {
      console.error("data file not found");
      return;
    }
    data = json.read(dataFile);
  }

  //adjust data
  let dir = `${data.type}/${sid}`;
  if (!data.shortId) {
    data.shortId = sid;
    if (!data.slug || data.slug == "") data.slug = slug(data.title); //if slug changed, cover fileName must be changed

    // handle base64-encoded data
    mdir(`${dataDir}/files`);
    let date = new Date();
    data.content = data.content.replace(
      /<img src="data:image\/(.+?);base64,(.+?)==">/g, //todo: handle other mimetypes
      (match, group1, group2, position, fullString) => {
        let file = `${data.slug}-${date.getTime()}.${group1}`; //todo: slug(title,limit=50)
        writeFileSync(`${dataDir}/files/${file}`, group2, "base64");

        //todo: then return <img ..>  https://stackoverflow.com/q/59962305/12577650
        //or queue.upload.$file=false

        return `<img src="${dir}/${file}" alt="${data.title}" />`;
      }
    );

    //todo: data.summary=summary(data.content)
    json.write(dataFile, data);
  }

  //uploading files:

  let mediaDir = `${MEDIA}/${dir}`,
    bucketDir = `${BUCKET}/${dir}`;
  mdir(mediaDir);

  if (existsSync(`${dataDir}/cover`)) {
    //ext = "."+req.file.mimetype.replace("image/", ""); //or ext(req.file.originalname)
    if (dev) console.log("uploading cover ...");
    data.cover = `${data.slug}${ext(data.tmp.cover.originalname)}`;
    bucket
      .upload(`${dataDir}/cover`, `${bucketDir}/${data.cover}`)
      .then(() => {
        rename(`${dataDir}/cover`, `${mediaDir}/${data.cover}`, e => {});
        if (dev) console.log("cover uploaded");
      })
      .catch(e => console.log("uploading cover failed", e));
  }

  readdir(`${dataDir}/files`, (err, files) => {
    if (!err) {
      files.forEach(file => {
        if (dev) console.log(`uploading file: ${file}`);
        bucket
          .upload(`${dataDir}/files/${file}`, `${bucketDir}/${file}`)
          .then(
            () => {
              rename(
                `${dataDir}/files/${file}`,
                `${mediaDir}/${file}`,
                e => {}
              );
              if (dev) console.log(`file uploaded: ${file}`);
            },
            e => {}
          )
          .catch(err => console.error(`uploading faild for ${file}`, err));
      });
    }
  });

  //insert data to db
  //todo: if(all previous seps completed)
  //i.e if !exists(cover) && no file exists in /files

  delete data.tmp;
  insertData(data)
    .then(data => {
      if (dev) console.log("data inserted", data);
      unlink(dataFile, e => {}); //todo: remove dataDir
      //create cache
      json.write(`./temp/${data.type}/${data.shortId}.json`, data);
      let indexCache = `./temp/${data.type}/index.json`;
      if (existsSync(indexCache)) {
        let { _id, shortId, slug, cover } = data; //todo:,summary
        json.write(
          indexCache,
          json.read(indexCache).unshift({ _id, shortId, slug, cover })
        );
        //or: cache(indexCache, ":purge:");
      }
    })
    .catch(error => console.log("Error @insertData()", error));

  //when done: remove queue/sid.json
}

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
  let sid = shortId.generate(),
    dir = `./data/queue/${sid}`;
  req.body.type = req.params.type;

  mdir(dir);
  json.write(`${dir}/data.json`, req.body);
  if (req.file) {
    renameSync(req.file.path, `${dir}/cover`);
    req.body.tmp = { cover: req.file };
  }

  saveData(sid, req.body);
  res.send({ ok: true, shortId: sid }); //todo: navigate to /s/shortId -> redirect to full link

  //the content will be available after the process completed (uploading files, inserting to db, ..)
});

app.get("/api/:category?/:id?", (req, res, next) => {
  console.log(req.params);
  let category = req.params.category,
    id = req.params.id;
  if (dev) console.log("app.get", { category, id });
  getData(req.params)
    .then(
      payload => {
        if (dev) console.log({ payload });
        if (typeof payload == "string") payload = JSON.parse(payload);
        if (id) {
          let cover = `${category}/${payload.shortId}/${payload.slug}-cover.jpg`;
          if (existsSync(`${MEDIA}/${cover}`)) payload.cover = cover;
        } else if (payload)
          payload.map(item => {
            let cover = `${category}/${item.shortId}/${item.slug}-cover.jpg`;
            if (existsSync(`${MEDIA}/${cover}`)) item.cover = cover;
            return item;
          });
        res.json({ type: id ? "item" : "list", payload });
      },
      error => ({ type: error, error }) //todo: content/index.html admin:show error
    )
    .catch(next); //https://expressjs.com/en/advanced/best-practice-performance.html#use-promises
});

// Serve static files; /file.ext will be served from /dist/browser/file.ext then /data/media/file.ext
app.get("*.*", express.static(DIST, { maxAge: "1y" })); //static assets i.e: created at build time; may be deleted at any time and recreated at build time
app.get("*.*", express.static(MEDIA, { maxAge: "1y" })); //data files i.e: created at runtime via API calls

// All regular routes use the Universal engine
app.get("*", (req, res) => {
  res.render("index", { req });
});

//app.listen() moved to a separate file `server-start.ts`, because firebase will handle it automatically
//when using this server without firebase, use `node dist/server-start`
export { app }; //for firebase
