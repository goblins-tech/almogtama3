import { connect, insertData, model } from "../mongoose/functions";
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
} from "../eldeeb/fs";
import { replaceAsync } from "../eldeeb/string";
import { Firebase } from "../eldeeb/firebase-admin";
import * as admin from "firebase-admin";
import multer from "multer";
import { slug } from "../src/app/content/functions";
import { resize as _resize, sharp } from "../eldeeb/graphics";
import {
  Categories,
  ArticlesCategories
} from "../src/app/content/functions/categories";

export const dev = process.env.NODE_ENV === "development";
export const DIST = join(process.cwd(), "./dist/browser"); //process.cwd() dosen't include /dist
export const MEDIA = join(process.cwd(), "./temp/media"); //don't save media files inside dist, as dist may be deleted at any time
export const BUCKET = "almogtama3.com/media"; //todo: $config.domain/media

//todo: use env:GOOGLE_APPLICATION_CREDENTIALS=Path.resolve("./firebase-almogtama3-eg.json")
admin.initializeApp({
  credential: admin.credential.cert(require("./firebase-almogtama3-eg.json")),
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
export function categories() {
  console.log("==categories==");
  let dir = "temp/articles/categories";
  let result = {};

  return cache(`${dir}/categories.json`, () =>
    connect().then(
      () =>
        Promise.all([
          model("categories")
            .find({})
            .lean(),
          model("article_categories")
            .find({})
            .lean()
        ])
          .then(([categories, articles_categories]) => {
            let ctg = new Categories(categories),
              actg = new ArticlesCategories(articles_categories, ctg);
            return {
              ...ctg.adjust(),
              ...actg.adjust()
              //inputs: ctg.createInputs(), or: inputs_articles, inputs_jobs
            };
          })
          .catch(err => {
            throw new Error(`Error @categories, ${err.message}`);
          }),
      1
    )
  );
}

//todo: id (ObjectId | shortId) | limit (number)
export function getData(params) {
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

export function saveData(data) {
  /*
  1- handle base46 data, then: upload images to firebase, then resize
  2- insert data to db
  3- upload cover image then resize it
   */
  if (dev) console.log("====saveData====", data);

  let sid = data.shortId;
  let dataDir = `./temp/queue/${sid}`,
    dataFile = `${dataDir}/data.json`,
    dir = `${data.type}/${sid}`;

  if (!data.slug || data.slug == "")
    data.slug = slug(data.title, 200, ":ar", false); //if slug changed, cover fileName must be changed

  // handle base64-encoded data
  mdir(`${dataDir}/files`);

  //data.images[]: an array contains all images pathes inside the article
  //to be downloaded when this article requested in case of the site moved to
  //a new server.
  //it contain all available sizes includes 'opt' (optimized version) but doesn't contain 'orig' (the original file)
  if (!data.images) data.images = [];
  let date = new Date();

  let mediaDir = `${MEDIA}/${dir}`,
    bucketDir = `${BUCKET}/${dir}`;
  mdir(mediaDir);

  return replaceAsync(
    data.content,
    /<img src="data:image\/(.+?);base64,(.+?)={0,2}">/g, //todo: handle other mimetypes
    (match, group1, group2, position, fullString) => {
      let file = `${data.slug}-${date.getTime()}.${group1}`; //todo: slug(title,limit=50)
      data.images.push(file);
      let tmp = `${mediaDir}/${file}`;

      if (dev) console.log(`uploading file: ${file}`);

      //or promises.writeFile().then() //expremental
      //or util.promisify(fs.writeFile()).then()
      return new Promise((r, j) => {
        writeFile(tmp, group2, "base64", err => {
          if (err) j(err);
          else r(tmp);
        });
      })
        .then(() => bucket.upload(tmp, `${bucketDir}/${file}`))
        .then(() =>
          resize(tmp, {
            type: data.type,
            shortId: sid
          }).then(imgs => {
            if (dev) console.log(`file ${file} uploaded & resized`, imgs);

            //imgs={width:path}
            let srcset, sizes; //todo:
            return `<img data-src="${dir}/${file}" data-srcset="${srcset}" sizes="${sizes}" alt="${data.title}" />`;
          })
        )

        .catch(err => {
          throw new Error(`Error @file: ${file}, ${err.message}`);
        });
    }
  )
    .then(content => {
      data.content = content;

      if (data.file && existsSync(data.file.path)) {
        if (dev) console.log("uploading cover ...");

        if (!data.cover)
          data.cover = {
            src: `${data.slug}${ext(data.file.originalname)}`
          };
        //todo: await until cover uploaded, then insert data

        return bucket
          .upload(data.file.path, `${bucketDir}/${data.cover.src}`)
          .then(() => {
            let coverDir = `${mediaDir}/${data.cover.src}`;
            renameSync(data.file.path, coverDir);
            return coverDir;
          })
          .then(coverDir =>
            resize(coverDir, {
              type: data.type,
              shortId: sid
            })
              .then(imgs => {
                if (dev) console.log("cover uploaded & resized", imgs);
                //todo: convert imgs to scrSet (i.e: img.jpg 400w,...)
                data.cover.srcSet = imgs;
              })
              .catch(err => console.error({ err }))
          )
          .catch(err => {
            throw new Error(`Error: uploading cover failed, ${err.message}`);
          });
      }
    })
    .then(() => {
      delete data.tmp;
      delete data.file;
      if (dev) console.log("inserting data", data);
      //we return the inner promise to catch it's thrown error
      //ex: promise.then(()=>{ return promise2.then(()=>{throw 'error'})} ).catch(e=>{/*inner error catched*/})
      //https://stackoverflow.com/a/39212325
      return insertData(data)
        .then(_data => {
          data = _data;
          if (dev) console.log("data inserted");
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
        .catch(err => {
          throw new Error(`Error @insertData(), ${err.message}`);
        });
    })
    .then(() => data);

  //todo: data.summary=summary(data.content)

  //todo: Promise.all([upload.cover, upload all files]).then(db.insert);

  //insert data to db
  //todo: if(all previous seps completed)
  //i.e if !exists(cover) && no file exists in /files

  //when done: remove queue/sid.json
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

/**
 * create resized version of an image
 * @method resize
 * @param  img    image path or Buffer
 * @return Promise<{size:path}>
 */
export function resize(img, info) {
  let originalSize = statSync(img).size; //todo: get size of Buffer img
  //todo: if(parts.type=="dir")size all images inside this dir
  //todo: add meta tag sized=true, original=file
  //todo: create an optimized version (same width as the original image)
  return sharp(img)
    .metadata()
    .then(meta => {
      return Promise.all(
        [400, 600, 800, 1000].map(
          //todo: && !existsSync(img_width.ext)
          width => {
            if (width < meta.width) return _resize(img, [width, null]);
            //todo: else Promise.reject("larger")
          }
        )
      )
        .then(images =>
          images
            .filter(image => image && image.size < originalSize) //ignore images larger than the original one
            //.map(el => [el.width, el.file])
            .reduce((total, current) => {
              //convert from array[ {width,file, ..} ] into {width:file}
              let file = current.file.replace(
                MEDIA,
                `${info.type}/${info.shortId}`
              );
              total[current.width] = file; //todo: remove D:/**,
              return total; //accumulator
            }, {})
        )
        .catch(err => console.error(err));
    });
}