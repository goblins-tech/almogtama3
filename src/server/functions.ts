import { connect, insertData, model } from "./mongoose/functions";
import mongoose from "mongoose";
import {
  cache,
  mdir,
  ext,
  parsePath,
  rename,
  renameSync,
  writeFileSync,
  existsSync,
  unlink,
  readdir,
  resolve,
  writeFile,
  json,
  statSync
  //promises //todo: promises.writeFile as writeFilePromise
} from "pkg/nodejs-tools/fs";
import { replaceAsync } from "pkg/nodejs-tools/string";
import { Firebase } from "pkg/firebase/admin";
import { initializeApp } from "firebase-admin";
import multer from "multer";
import { slug } from "../app/content/functions";
import { resize, sharp } from "pkg/graphics";
import { Categories } from "pkg/ngx-formly/categories-material/functions";
import { setTimer, getTimer, endTimer } from "pkg/nodejs-tools/timer";
import { BUCKET, FIREBASE, TEMP } from "../config/server";

export const dev = process.env.NODE_ENV === "development";

/*
process.cwd() for firebase = functions.source (i.e: ./dist)
whitch is different from here (i.e /)
so using process.cwd() will give different values for
`npm run start` and `npm run firebase:serve`

process.env.INIT_CWD is the path where `npm run` runned, regardless of the current working directory
you must run `npm start` or `npm firebase:serve` from the project's root dir.

another solution is to replace process.cwd() with it's value when building this file with webpack
to be a fixed value in both cases.

or re-set the view dir in firebase/index to be relative to it's process.cwd() dir
i.e functions.source (./dist)
app.set("views", "./browser");

todo: process.env.INIT_CWD || ?? -> check if process.env.INIT_CWD is undefined
*/

//todo: use env:GOOGLE_APPLICATION_CREDENTIALS=Path.resolve("./firebase-almogtama3-eg.json")
initializeApp(FIREBASE);

export const bucket = new Firebase(/*{
  project: "almogtama3-eg",
  cert: require("./firebase-almogtama3-eg.json")
}*/).storage();

/**
 * get adjusted categories (i.e: adding branches, top to each entry & add main categories)
 * & adjusted articles_categories (i.e: article_categories & category_articles)
 * & inputs (for forms)
 * @method categories
 * @return {categories, main, article_categories, category_articles, inputs}
 */
export function getCategories() {
  return cache("temp/articles/categories.json", () =>
    connect().then(() => {
      setTimer("getCategories");
      return Promise.all([
        model("categories")
          .find({})
          .lean(),
        model("articles")
          .find({}, "categories")
          .lean()
      ])
        .then(([categories, articles_categories]) => {
          if (dev)
            console.log(
              "[server] getCategories: fetched from server",
              getTimer("getCategories")
            );
          /*
          //don't close the connection after every query
          //todo: close the connection when the server restarts or shutdown
          //https://hashnode.com/post/do-we-need-to-close-mongoose-connection-cjetx0dxh003hcws2l1fs81nl
          mongoose.connection.close(() => {
            if (dev) console.log("connection closed");
          });
          */
          let ctg = new Categories(categories);
          ctg.adjust();
          if (dev)
            console.log(
              "[server] getCategories: adjusted",
              endTimer("getCategories")
            );
          return ctg.articleCategories(articles_categories);
        })
        .catch(err => {
          console.error("Error @categories", err);
          throw new Error(`Error @categories, ${err.message}`);
        });
    }, 1)
  );
}

//todo: id (ObjectId | shortId) | limit (number)
export function getData(params) {
  //setTimer("getData"); //timer('getData') = timer('cache')
  var cacheFile = `${TEMP}/articles`; //todo: ./temp/$type
  if (params.id) cacheFile += `/${params.id}/data`;
  else if (params.category) cacheFile += `/${params.category}`;
  else cacheFile += "index";

  cacheFile += ".json";

  //docs to be fetched in list mode
  let docs = "_id title subtitle slug summary author cover updatedAt";

  return cache(
    cacheFile,
    () =>
      connect()
        .then(() => {
          let contentModel = model("articles"),
            content;

          /*
              deprecated! now _id is type of ShortId
            if (params.id.length == 24)
              content = contentModel.findById(params.id);
            else
              content = contentModel.find({ shortId: params.id }, null, {
                limit: 1
              }); //note that the returned result is an array, not object
              */
          if (params.id) content = contentModel.findById(params.id);
          else if (
            !params.category ||
            ["articles", "jobs"].includes(params.category)
          )
            content = contentModel.find(
              { type: params.category || "articles", status: "approved" },
              docs,
              {
                limit: 50
              }
            );
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
              if (dev)
                console.log("categories", { categories, article_categories });
              //get category._id from category.slug
              let category,
                selectedArticles = [];

              if (category == "jobs" || category == "articles") {
                selectedArticles = [];
                //todo: select articles where article.type==article
              } else {
                category = categories.find(el => el.slug == params.category);
                if (dev) console.log("category", category);

                if (category) {
                  //get articles from article_categories where category=category._id
                  article_categories.forEach(el => {
                    if (el.category == category._id)
                      selectedArticles.push(el.article);
                  });
                }
              }

              if (dev) console.log({ selectedArticles });

              //get articles from 'articles' where _id in selectedArticles[]
              let articles = model("articles").find(
                { _id: { $in: selectedArticles } },
                docs, //todo: {shortid,title,slug,summary|content}
                {
                  limit: params.limit || 50,
                  sort: { _id: -1 }
                }
              );

              //  if (env.dev)  articles.then(result => console.log("articles", result));
              return articles;
            });
          }

          return content;
        })
        .then(content => {
          /*
        mongoose.connection.close(() => {
          if (dev) console.log("connection closed");
        });
         */
          //  if (dev) console.log("[server] getData", endTimer("getData"));
          return content;
        }),
    //todo: ?refresh=AUTH_TOKEN
    params.refresh ? 0 : params.id ? 3 : 24
  );
}

export function saveData(data, update: boolean) {
  //todo: replace content then return insertData()
  /*
  1- handle base46 data, then: upload images to firebase, then resize
  2- insert data to db
  3- upload cover image then resize it
   */
  setTimer("saveData");
  if (dev) console.log("[server] saveData", data);

  let date = new Date();

  if (!data.slug || data.slug == "")
    data.slug = slug(data.title, 200, ":ar", false); //if slug changed, cover fileName must be changed
  if (dev) data.status = "approved";

  // handle base64-encoded data (async)
  data.content = data.content.replace(
    /<img src="data:image\/(.+?);base64,([^=]+)={0,2}">/g,
    (match, extention, imgData, matchPosition, fullString) => {
      let fileName = date.getTime(),
        bucketPath = `${BUCKET}/${data.type}/${data._id}/${fileName}.webp`,
        src = `/image/${data.type}-${fileName}-${data._id}/${data.slug}.webp`,
        srcset = "",
        sizes = "";
      for (let i = 1; i < 10; i++) {
        srcset += `${src}?size=${i * 250} ${i * 250}w,`;
      }

      //todo: catch(err=>writeFile('queue/*',{imgData,err})) to retry uploading again
      resize(imgData, "", { format: "webp", input: "base64" })
        .then(data => bucket.upload(data, bucketPath)) //todo: get fileName
        .then(() => console.log(`[server] uploaded: ${fileName}`));
      //todo: get image dimentions from dataImg
      return `<img width="" height="" data-src="${src}" data-srcset="${srcset}" sizes="${sizes}" alt="${data.title}" />`;
    }
  );

  //upload cover
  if (data.file) {
    //delete data.file early, before insertData(data) starts
    let cover = data.file;
    delete data.file;
    if (dev) console.log("uploading cover ...");
    data.cover = true;

    //to get original name: cover.originalname
    let bucketPath = `${BUCKET}/${data.type}/${data._id}/cover.webp`;

    resize(cover.path, "", { format: "webp" })
      .then(data => bucket.upload(data, bucketPath))
      .then(file => {
        unlink(cover.path, () => {}); //async
        console.log(`[server] cover uploaded`);
      });
  }

  writeFile(`${TEMP}/articles/${params.id}/data.json`, error =>
    console.error(`cannot write the temp file for: ${params._id}`, error)
  );
  //todo: data.summary=summary(data.content)
  return insertData(data, update);
}

export const jsonData = {
  get(type: string, id?: string | Number) {
    let file = `${TEMP}/${type}/${id ? id + "/data" : "index"}.json`;
    try {
      return json.read(file);
    } catch (e) {
      console.warn(`jsonData.get(${type},${id}) failed`, e);
    }
  },
  save(type: string, data) {
    if (data) {
      let dir = `${TEMP}/${type}`;
      mdir(dir);
      if (data instanceof Array) json.write(`${dir}/index.json`, data);
      else json.write(`${dir}/${data._id}/data.json`, data);
    }
  }
};

//multer hanles multipart/form-data ONLY, make sure to add enctype="multipart/form-data" to <form>
//todo: add multer to specific urls: app.post(url,multer,(req,res)=>{})
//todo: if(error)res.json(error)
//todo: fn upload(options){return merge(options,defaultOptions)}
export let upload = multer({
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
      let dir = `${TEMP}/uploads`;
      mdir(dir);
      cb(null, dir);
    },
    filename: function(req, file, cb) {
      cb(null, `tmp${new Date().getTime()}.tmp`);
    }
  })
});
