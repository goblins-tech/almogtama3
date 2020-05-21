import { connect as _connect, model, mongoose } from "pkg/mongoose";
import { schemas, DB } from "../../config/server";

export function connect() {
  return _connect(
    {
      auth: DB.auth,
      host: DB.host,
      srv: DB.srv,
      dbName: DB.dbName
    },
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

  if (collection instanceof mongoose.model) return collection;
  if (!schemaObj)
    schemaObj = collection in schemas ? schemas[collection] : schemas["basic"];
  return model(collection, schemaObj, { strict: false });
}
