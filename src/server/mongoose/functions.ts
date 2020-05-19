import { connect as _connect, model as _model, mongoose } from "pkg/mongoose";
import { dev, schemas, DB } from "../../config/server";
import { unlink } from "pkg/nodejs-tools/fs";

function encode(str: string) {
  return encodeURIComponent(str).replace(/%/g, "%25");
}

export function connect() {
  //todo: get db config from /config.ts
  if (dev)
    console.log({
      connection: mongoose.connection,
      readyState: mongoose.connection.readyState
    });
  return mongoose.connection.readyState == 0
    ? _connect({
        auth: DB.auth,
        host: DB.host,
        srv: DB.srv,
        dbName: DB.dbName
      })
    : Promise.resolve(mongoose.connection);
}

export function insertData(data, update: boolean) {
  if (!data) return Promise.reject({ error: { message: "no data" } });

  //data.type is singular (i.e: article, job),
  //  but collection name is plural (i.e: articles, jobs)
  let type = ["article", "job", "jobs"].includes(data.type)
    ? "articles"
    : data.type || "articles";

  return connect().then(() => {
    let contentModel = model(type);
    if (update)
      return (
        contentModel
          .replaceOne({ _id: data._id }, data, {
            upsert: true,
            timestamps: true
          })
          //return data to the front-End
          .then(doc => {
            unlink(`./temp/articles/${data._id}.json`, () => {});
            return data;
          })
      );
    let content = new contentModel(data);
    return content.save();
  });
}

export function model(collection) {
  //console.log("model: " +{ type, models: mongoose.models, modelNames: mongoose.modelNames() });
  //todo: schemas/mongoose.ts

  let schemaObj =
    collection in schemas ? schemas[collection] : schemas["basic"];
  return _model(collection, schemaObj, { strict: false });
}
