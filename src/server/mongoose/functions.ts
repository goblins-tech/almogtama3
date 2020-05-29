import { connect as _connect, model, mongoose } from "pkg/mongoose";
import { schemas, DB } from "../../config/server";

export function connect(uri?) {
  return _connect(
    Object.assign(uri || {}, {
      auth: DB.auth,
      host: DB.host,
      srv: DB.srv,
      dbName: DB.dbName
    }),
    { multiple: false }
  );
}

export function disconnect() {
  //close all connections;  OR: mongoose.connection.close()
  return mongoose.disconnect();
}

export function getModel(collection, schemaObj = {}) {
  //console.log("model: " +{ type, models: mongoose.models, modelNames: mongoose.modelNames() });
  //todo: schemas/mongoose.ts

  if (!schemaObj) {
    let schemaName = collection.indexOf("_categories")
      ? "categories"
      : collection;
    schemaObj =
      schemaName in schemas ? schemas[schemaName] : schemas["basic"] || {};
  }

  return model(collection, schemaObj, { strict: false });
}
