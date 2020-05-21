import express from "express";
import shortId from "shortid";
import { connect, getModel } from "../mongoose/functions";
import { dev, TEMP, BUCKET } from "../../config/server";
import { upload, bucket, getCategories } from "../functions";
import { cache } from "pkg/nodejs-tools/fs";
import { Categories } from "pkg/ngx-formly/categories-material/functions";
import { setTimer, endTimer, getTimer } from "pkg/nodejs-tools/timer";
import { resize } from "pkg/graphics";

//todo: don't import from ngx-* packages, because it may contain browser-specific APIs.
import { slug } from "pkg/ngx-content/core/functions";

//todo: import {} from 'fs/promises' dosen't work yet (expremental)
const { readdir, writeFile, unlink } = require("fs").promises;

const app = express.Router();

//todo: update collection list
//todo: get collections from db, then collections.map(el=>/*rename or remove*/), save to ./temp/supportedCollections.json
const supportedCollections = [
  "articles",
  "jobs",
  "articles_categories",
  "jobs_collections",
  "countries",
  "keywoards",
  "persons",
  "languages"
];
app.get("/collections", (req, res) => res.json(supportedCollections));

/**
 * quickly perform db operations via an API call
 * @example: GET /api/v1/find/articles
 * @example: GET /api/v1/find/articles?limit=50
 * @example: GET /api/v1/find/articles/$articleId
 * @example: GET /api/v1/find/articles?filter={status:'pending'}
 * @method query
 * @param  operation  operation name, ex: find
 * @param  modelObj   model object (as accepted in pkg/mongoose model()) or collection name as string
 * @param  params  every operation has it's own params, for example find accepts filter, docs, options
 * @return Query
 */
//todo: import modelObj types from pkg/mongoose
export function query(
  operation: string,
  collection: string | Array<any>,
  ...params
) {
  return connect().then(() => {
    let contentModel =
      collection instanceof Array
        ? getModel(collection[0], collection[1]) //todo: ...collection gives error
        : getModel(collection);

    if (typeof params[0] === "string") {
      //todo: support other operations by id (ex: delete)
      if (operation == "find") return contentModel.findById(params[0]).lean();
    }
    return contentModel[operation](...params).lean();
  });
}

/*
  perform db operations via API.
  todo: use AUTH_TOKEN
  todo: send small data via app.post()
  ex: /api/v1/:find/articles?limit=20
  ex: /api/v1/articles/$articleId
 */
app.get(/\/:([^\/]+)\/([^\/]+)(?:\/(.+))?/, (req, res) => {
  let operation = req.params[0],
    collection = req.params[1],
    item = req.params[2], //itemId
    params = req.query.params; //array of function params ex: find(...params)

  setTimer(`get ${req.url}`);

  if (!(params instanceof Array)) params = [<string>params];

  //todo: (...., item || ...params) -> error
  let result = item
    ? query(operation, collection, item)
    : query(operation, collection, ...(<Array<any>>params));
  result
    .then(data => res.json(data))
    .catch(error => res.json({ error }))
    .then(() => {
      if (dev) console.log("[serer] get", req.url, endTimer(`get_${req.url}`));
    });
});

/*
-> $collection
-> $collection/$itemId
-> $collection/$itemType=$itemValue

  ex: /api/v1/articles?limit=50 -> get all articles
  ex: /api/v1/articles/123 -> get article: 123
  ex: /api/v1/articles/category=123 -> get articles from this category
  ex: /api/v1/articles_categories -> get categories list
 */
app.get(/\/([^\/]+)(?:\/(.+))?/, (req, res, next) => {
  let collection = req.params[0],
    itemType,
    item;

  setTimer(`get ${req.url}`);

  if (!req.params[1]) itemType = "index";
  else if (req.params[1].indexOf("=") !== -1)
    [itemType, item] = req.params[1].split("=");
  else {
    itemType = "item";
    item = req.params[1];
  }

  //------------------ API route validation ------------------//
  if (!["item", "category", "index", "image"].includes(itemType))
    return res.json({
      error: {
        message: "unknown itemType, allowed values: item, category, index"
      }
    });

  /* todo:
  if (!supportedCollections.includes(collection))
    return res.json({
      error: {
        message:
          "unknown collection, use /api/v1/collections to list the allowed collections"
      }
    }); */

  if (itemType != "index" && !item)
    return res.json({ error: { message: "no id provided" } });
  //------------------ /API route validation ------------------//

  //todo: add query to file cashe ex: articles_index?filter={status:approved}
  //  -> articles_index__JSON_stringify(query)
  //for item temp=.../item/$id/data.json because this folder will also contain it's images
  let tmp = `${TEMP}/${collection}/${itemType}${item ? `/${item}` : ""}${
    itemType == "item" ? "/data" : ""
  }.json`;

  return cache(
    tmp,
    () =>
      connect().then(() => {
        let content;
        if (itemType == "item") content = query("find", collection, item);
        else {
          let findOptions = {
            filter: JSON.parse(<string>req.query.filter || null) || {},
            //todo: support docs{} -> typeod docsstring in both cases
            docs: req.query.docs, //projection
            options: JSON.parse(<string>req.query.options || null) || {}
          };
          if (req.query.limit) findOptions.options.limit = req.query.limit;

          if (
            ["articles", "jobs"].includes(collection) &&
            !findOptions.filter.status
          )
            findOptions.filter.status = "approved";
          if (findOptions.filter.status === null)
            delete findOptions.filter.status;

          if (itemType == "index") {
            content = query(
              "find",
              collection,
              findOptions.filter,
              findOptions.docs,
              findOptions.options
            );
          } else if (itemType == "category") {
            content = getCategories(collection).then(categories => {
              let ctg = new Categories(categories);

              let category = categories.categories.find(el => el.slug == item);

              let branches = [category, ...ctg.getBranches(category)];
              let items = new Set();

              categories = categories.categories
                .find(el => branches.includes(el))
                .forEach(el => {
                  if (el.items instanceof Array)
                    el.items.forEach(item => items.add(item));
                });

              findOptions.filter._id = { $in: items };
              return query(
                "find",
                collection,
                findOptions.filter,
                findOptions.docs,
                findOptions.options
              );
            });
          } else if (itemType == "image") {
          }
        }
        return content;
      }),
    //todo: ?refresh=AUTH_TOKEN
    req.query.refresh ? 0 : 3
  )
    .then(payload => {
      res.json(payload);
      return payload;
    })
    .catch(error => {
      res.json({ error });
      return { error };
    })
    .then(result => {
      if (dev)
        console[result.error ? "error" : "log"](
          "[server] getData:",
          endTimer(`get ${req.url}`),
          result
        );
    });
});

//todo: /\/(?<type>image|cover)\/(?<id>[^\/]+) https://github.com/expressjs/express/issues/4277
//ex: <img src="/images/articles-cover-$topicId/slug-text.png?size=250" />
//todo: change to /api/v1/articles/image/$articleId-$imageName (move to the previous app.get(); execlude from ngsw cache)
//todo:  /api/v1/$collection/image=$name-$id/slug-text?size
app.get(/\/image\/([^/-]+)-([^/-]+)-([^/]+)/, (req, res) => {
  setTimer("/image");

  //todo: use system.temp folder
  let collection = req.params[0],
    name = req.params[1],
    id = req.params[2],
    size = <string>req.query.size,
    path = `${collection}/${id}/${name}`,
    bucketPath = `${BUCKET}/${path}.webp`,
    localPath = `${TEMP}/${path}.webp`,
    resizedPath = `${localPath}_${size}.webp`;

  if (!id || !collection)
    return res.json({
      error: { message: "[server] undefined id or collection " }
    });

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

//todo: typescript: add files[] to `req` definition
//todo: cover= only one img -> upload.single()
//todo: change to /api/v1/collection/itemType[/id]
app.post("/:collection", upload.single("cover"), (req: any, res) => {
  if (dev)
    console.log("[server] post", {
      body: req.body,
      files: req.files,
      file: req.file,
      cover: req.body.cover //should be moved to files[] via multer
    });

  if (!req.body || !req.body.content)
    return res.send({ error: { message: "no data posted" } });

  let data = req.body;

  let update;
  if (!data._id) {
    data._id = shortId.generate();
    update = false;
  } else update = true;
  let collection = req.params.collection;

  if (collection == "article") collection = "articles";
  else if (collection == "job") collection = "jobs";
  setTimer(`post ${req.url}`);

  //todo: replace content then return insertData()
  /*
  1- handle base46 data, then: upload images to firebase, then resize
  2- insert data to db
  3- upload cover image then resize it
   */

  let date = new Date();

  if (!data.slug || data.slug == "")
    data.slug = slug(data.title, 200, ":ar", false); //if slug changed, cover fileName must be changed
  if (dev) data.status = "approved";

  // handle base64-encoded data (async)
  data.content = data.content.replace(
    /<img src="data:image\/(.+?);base64,([^=]+)={0,2}">/g,
    (match, extention, imgData, matchPosition, fullString) => {
      let fileName = date.getTime(),
        bucketPath = `${BUCKET}/${collection}/${data._id}/${fileName}.webp`,
        src = `api/v1/image/${collection}-${fileName}-${data._id}/${data.slug}.webp`,
        srcset = "",
        sizes = "";
      for (let i = 1; i < 10; i++) {
        srcset += `${src}?size=${i * 250} ${i * 250}w,`;
      }

      //todo: catch(err=>writeFile('queue/*',{imgData,err})) to retry uploading again
      resize(imgData, "", { format: "webp", input: "base64" })
        .then(data => bucket.upload(data, bucketPath)) //todo: get fileName
        .then(() => {
          console.log(`[server] uploaded: ${fileName}`);
          writeFile(`${TEMP}/${collection}/item/${data._id}/${fileName}.webp`);
        });
      //todo: get image dimentions from dataImg
      return `<img width="" height="" data-src="${src}" data-srcset="${srcset}" sizes="${sizes}" alt="${data.title}" />`;
    }
  );

  //upload cover
  if (req.file && req.file.buffer) {
    if (dev) console.log("[server] uploading cover ...");
    data.cover = true;

    //to get original name: cover.originalname
    let bucketPath = `${BUCKET}/${collection}/${data._id}/cover.webp`;

    resize(req.file.buffer, "", { format: "webp" })
      .then(data => bucket.upload(data, bucketPath))
      .then(file => {
        console.log(`[server] cover uploaded`);
        writeFile(
          `${TEMP}/${collection}/item/${data.id}/cover.webp`,
          req.file.buffer
        );
      });
  }

  writeFile(`${TEMP}/${collection}/item/${data.id}/data.json`, data).catch(
    error =>
      console.error(
        `[server] cannot write the temp file for: ${data._id}`,
        error
      )
  );

  //todo: data.summary=summary(data.content)

  connect()
    .then(() => {
      let contentModel = getModel(collection);
      if (update)
        return (
          contentModel
            .replaceOne({ _id: data._id }, data, {
              upsert: true,
              timestamps: true
            })
            //return data to the front-End
            .then(doc => {
              let temp = `${TEMP}/${collection}/item/${data._id}`;
              readdir(temp).then(files => {
                files.forEach(file => {
                  //remove images and cover sizes; cover.webp, $images.webp and data.json are already renewed.
                  if (file.indexOf(".webp") && file.indexOf("_") !== -1)
                    unlink(`${temp}/${file}`).catch(error =>
                      console.error(`[server] cannot delete ${temp}/${file}`, {
                        error
                      })
                    );
                });
              });

              return data;
            })
        );
      let content = new contentModel(data);
      return content.save();
    })
    .then(data => {
      res.send(data);
      return data;
    })
    .catch(error => {
      res.send({ error });
      return { error };
    })
    .then(result => {
      if (dev)
        console[result.error ? "error" : "log"](
          `[server] post: ${collection}`,
          endTimer(`post ${req.url}`),
          result
        );
    });

  //the content will be available after the process completed (uploading files, inserting to db, ..)
});

export default app;
