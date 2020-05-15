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
  join,
  resolve,
  writeFile,
  json,
  statSync
  //promises //todo: promises.writeFile as writeFilePromise
} from "pkg/nodejs-tools/fs";
import { replaceAsync } from "pkg/nodejs-tools/string";
import { Firebase } from "pkg/firebase/admin";
import { initializeApp, credential } from "firebase-admin";
import multer from "multer";
import { slug } from "../app/content/functions";
import { resize, sharp } from "pkg/graphics";
import { Categories } from "pkg/ngx-formly/categories-material/functions";
import { setTimer, getTimer, endTimer } from "pkg/nodejs-tools/timer";

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
export const BROWSER = join(process.env.INIT_CWD || "", "./dist/browser"); //process.cwd() dosen't include /dist
export const MEDIA = join(process.env.INIT_CWD || "", "./temp/media"); //don't save media files inside dist, as dist may be deleted at any time
export const BUCKET = `${dev ? "test" : "almogtama3.com"}/media`; //todo: $config.domain/media

//todo: use env:GOOGLE_APPLICATION_CREDENTIALS=Path.resolve("./firebase-almogtama3-eg.json")
initializeApp({
  credential: credential.cert(require("./firebase-almogtama3-eg.json")),
  storageBucket: `gs://almogtama3-eg.appspot.com`
});

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
          mongoose.connection.close();
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
  var cacheFile = "./temp/articles/"; //todo: ./temp/$type
  if (params.id) cacheFile += `/${params.id}`;
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
          mongoose.connection.close();
          //  if (dev) console.log("[server] getData", endTimer("getData"));
          return content;
        }),
    params.id ? 3 : 24
  );
}

export function saveData(data) {
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
  data.content.replace(
    /<img src="data:image\/(.+?);base64,(.+?)={0,2}">/g,
    (match, extention, imgData, matchPosition, fullString) => {
      let fileName = `${data._id}-${date.getTime()}`,
        bucketFileName = `${BUCKET}/${data.type}/image/${fileName}.webp`,
        imgName = `/image/${fileName}/${data.slug}.webp`,
        srcset = "",
        sizes = ""; //todo: ?size=

      //todo: catch(err=>writeFile('queue/*',{imgData,err})) to retry uploading again
      resize(imgData, "", { format: "webp" })
        .then(data =>
          //todo: upload by data (buffer)
          bucket.upload(data, `${bucketFileName}`)
        ) //todo: get fileName
        .then(file => console.log(`[server] ${file} uploaded`));

      return `<img data-src="${imgName}" data-srcset="${srcset}" sizes="${sizes}" alt="${data.title}" />`;
    }
  );

  //upload cover
  if (data.file) {
    if (dev) console.log("uploading cover ...");
    data.cover = true;

    //to get original name: data.file.originalname
    let fileName = `${data._id}`,
      bucketFileName = `${BUCKET}/${data.type}/cover/${fileName}.webp`,
      imgName = `/cover/${fileName}/${data.slug}.webp`,
      srcset = "",
      sizes = "";

    resize(data.file.path, "", { format: "webp" })
      .then(data => bucket.upload(data, `${bucketFileName}`))
      .then(file => {
        delete data.tmp;
        unlink(data.tmp.path, () => {}); //async
        console.log(`[server] cover uploaded`);
      });
  }

  //we return the inner promise to catch it's thrown error
  //ex: promise.then(()=>{ return promise2.then(()=>{throw 'error'})} ).catch(e=>{/*inner error catched*/})
  //https://stackoverflow.com/a/39212325
  //todo: data.summary=summary(data.content)
  return insertData(data)
    .then(data => {
      if (dev) console.log("data inserted");
    })
    .catch(err => {
      throw new Error(`Error @insertData(), ${err.message}`);
    });
}

export const jsonData = {
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
      let dir = "./temp/uploads";
      mdir(dir);
      cb(null, dir);
    },
    filename: function(req, file, cb) {
      cb(null, `tmp${new Date().getTime()}.tmp`);
    }
  })
});

//todo: move to pkg/graphics
/**
 * create resized version of an image
 * @method resize
 * @param  img    image path or Buffer
 * @param sizes    [array of sizes]
 * @return Promise<{size:path}>
 */
/*
export function resizeAll(img, sizes: Array<any>) {
  setTimer("resizeAll");
  let originalSize = statSync(img).size; //todo: get size of Buffer img
  //todo: if(parts.type=="dir")size all images inside this dir
  //todo: add meta tag sized=true, original=file
  //todo: create an optimized version (same width as the original image)

  //todo: foreach size resize(img,size)
  return sharp(img)
    .metadata()
    .then(meta => {
      return Promise.all(
        sizes.map(
          //todo: && !existsSync(img_width.ext)
          width => {
            if (width < meta.width) return resize(img, [width, null]);
            //todo: else Promise.reject("larger")
          }
        )
      )
        .then(images => {
          if (dev)
            console.log("[server] resizeAll", endTimer("resizeAll"), img);
          return (
            images
              .filter(image => image && image.size < originalSize) //ignore images larger than the original one
              //.map(el => [el.width, el.file])
              .reduce((total, current) => {
                //convert from array[ {width,file, ..} ] into {width:file}
                let file = current.file.replace(
                  MEDIA,
                  `${info.type}/${info.id}`
                );
                total[current.width] = file; //todo: remove D:/**,
                return total; //accumulator
              }, {})
          );
        })
        .catch(err => console.error(err));
    });
}
*/
