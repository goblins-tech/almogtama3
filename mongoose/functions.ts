import * as mongoose from "../eldeeb/mongoose";
import * as schemas from "./models";

const dev = process.env.NODE_ENV === "development";
function encode(str: string) {
  return encodeURIComponent(str).replace(/%/g, "%25");
}

//todo: use eldeeb.mongoose
export function connect() {
  //todo: get db config from /config.ts
  let url = `mongodb+srv://${encode("xxyyzz2050")}:${encode(
    "Xx159753@@"
  )}@almogtama3-gbdqa.gcp.mongodb.net/test?retryWrites=true&w=majority`;

  return mongoose.connect({
    auth: ["xxyyzz2050", "Xx159753@@"],
    host: "almogtama3-gbdqa.gcp.mongodb.net",
    srv: true,
    db: process.env.NODE_ENV == "production" ? "almogtama3" : "test"
  });
}

export function insertData(data) {
  let type = data.type || "article";
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
  return mongoose.model(collection, schemaObj, { strict: false });
}
