import { connect as _connect, model as _model, mongoose } from "pkg/mongoose";
import * as schemas from "./models";

const dev = process.env.NODE_ENV === "development";
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
        auth: ["xxyyzz2050", "Xx159753@@"],
        host: "almogtama3-gbdqa.gcp.mongodb.net",
        srv: true,
        db: dev ? "test" : "almogtama3"
      })
    : new Promise(r => mongoose.connection);
}

export function insertData(data) {
  let type = data.type || "articles";
  if (type == "jobs") type = "articles";
  return connect().then(
    () => {
      if (dev) console.log("connected");
      if (data) {
        let contentModel = model(type);
        let content = new contentModel(data);
        return content.save();
      }
    },
    err => {
      console.error("connection failed", { err });
      throw "connection failed!";
    }
  );
}

export function model(collection) {
  //console.log("model: " +{ type, models: mongoose.models, modelNames: mongoose.modelNames() });
  //todo: schemas/mongoose.ts

  let schemaObj =
    collection in schemas ? schemas[collection] : schemas["basic"];
  return _model(collection, schemaObj, { strict: false });
}
