// todo: export default mongoose (instead of export every method separately) i.e import mongoose, not import * as mongoose ..
import mongoose from "mongoose";
import shortId from "shortid";
import { setTimer, endTimer } from "pkg/nodejs-tools/timer";
export { mongoose };

/*
todo: export single properties from mongoose
import { exportAll } from "./general";
exportAll(mongoose);
*/

const dev = process.env.NODE_ENV === "development";

export namespace types {
  // todo: merge `namespace types` from ./index.d.ts
  export interface Object {
    [key: string]: any;
  }

  export interface ConnectionOptions extends mongoose.ConnectionOptions {
    dbName?: string;
  }
  export interface Model extends types.Object {
    fields?: types.Object;
    methods?: [];
    virtuals?: [];
    indexes?: []; // or:{indexName: value}
    // todo: add model properties
  }
  export type uri =
    | string
    | {
        auth: [string, string];
        host?: string | string[]; // host1:port1,...
        srv?: boolean;
        dbName?: string;
      };
  //-->deprecated
  //| [string, string, string | string[], boolean, string]; // [user,pass,host,srv,dbName]
}

/*
Object.keys(mongoose).forEach(key => {
  exports[key] = mongoose[key]; //todo: ES export i.e export key = mongoose[key]
});*/

export function connect(uri: types.uri, options?: types.ConnectionOptions) {
  setTimer("connect");
  const defaultOptions = {
    // todo: export static defaultConnectionOptions={..}
    useCreateIndex: true,
    useNewUrlParser: true, // https://mongoosejs.com/docs/deprecations.html; now it gives "MongoError: authentication fail"
    useFindAndModify: false,
    bufferCommands: false, // https://mongoosejs.com/docs/connections.html
    autoIndex: false,
    useUnifiedTopology: true,
    retryWrites: true,
    w: "majority"
  };

  let srv = false;
  if (typeof uri !== "string") {
    /* -->deprecated
    if (uri instanceof Array) {
      uri = {
        auth: [uri[0], uri[1]],
        host: uri[2],
        srv: uri[3],
        dbName: uri[4]
      };
    } */

    srv = uri.srv;
    if (!uri.host) {
      uri.host = "localhost:27017";
    } else if (uri.host instanceof Array) {
      uri.host = uri.host.join(",");
    }

    uri = `${encode(uri.auth[0])}:${encode(uri.auth[1])}@${uri.host}/${
      uri.dbName
    }`;
  }

  if ((uri as string).substr(0, 7) != "mongodb") {
    uri = "mongodb" + (srv ? "+srv" : "") + "://" + uri;
  }

  options = Object.assign(options || {}, defaultOptions);
  if (dev) console.log("[mongoose]", { uri, options });

  // todo: return Promise<this mongoose, not Mongoose>
  return mongoose.connect(uri as string, options).then(c => {
    if (dev) console.log("[mongoose] connected", endTimer("connect"));
    return c;
  });
}

export function model(
  collection: string,
  obj: types.Model,
  options?: mongoose.SchemaOptions
) {
  // todo: merge schema's defaultOptions
  if (mongoose.models[collection]) return mongoose.models[collection];
  let schema: mongoose.Schema;
  options = options || {};
  if (!("fields" in obj)) obj = { fields: obj };

  options.collection = collection;
  if (!("timestamps" in options)) options.timestamps = true; //add createdAt, updatedAt https://mongoosejs.com/docs/guide.html#timestamps

  if (options.shortId !== false && !("_id" in obj.fields)) {
    obj.fields._id = { type: String, default: shortId.generate };
    delete options.shortId;
  }
  schema = new mongoose.Schema(obj.fields, options);
  // todo: add methods,virtuals,...

  //to get schema: model.schema
  return mongoose.model(collection, schema);
}

export function encode(str: string) {
  return encodeURIComponent(str); //.replace(/%/g, "%25");
}
