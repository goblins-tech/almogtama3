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
    multiple?: boolean; //don't create a new connection if there are connections already open
  }
  export interface Model extends types.Object {
    fields?: types.Object;
    methods?: [];
    virtuals?: [];
    indexes?: []; // or:{indexName: value}
    // todo: add model properties
  }
  export interface Host {
    [host: string]: number; // { host1: port1 }
  }
  export type uri =
    | string
    | {
        auth: string[]; //https://github.com/microsoft/TypeScript/issues/38652
        host?: string | Host[];
        srv?: boolean;
        dbName?: string;
      };
  //-->deprecated:
  //| [string, string, string | string[], boolean, string]; // [user,pass,host,srv,dbName]

  export type BackupFilter = (db?: string, collection?: string) => boolean;
  export interface Obj {
    [key: string]: any;
  }

  export interface BackupData {
    info: Obj;
    backup: {
      [db: string]: {
        [collection: string]: {
          data: Obj[];
          info?: Obj;
          schema?: Obj;
          modelOptions?: Obj;
        };
      };
    };
  }
}

/*
Object.keys(mongoose).forEach(key => {
  exports[key] = mongoose[key]; //todo: ES export i.e export key = mongoose[key]
});*/

export function connect(uri: types.uri, options: types.ConnectionOptions = {}) {
  if (!options.multiple && mongoose.connection.readyState > 0) {
    console.log("[mongoose] already connected");
    return Promise.resolve(mongoose.connection);
  }

  delete options.multiple;

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
    w: "majority",
    keepAlive: true
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
    //this will log in both dev & prod mode to track the connection execution time.
    console.log("[mongoose] connected", endTimer("connect"));
    return c;
  });
}

export function model(
  collection: string,
  obj: types.Model = {},
  options?: mongoose.SchemaOptions,
  con? //example: db = mongoose.connection.useDb('dbName')
) {
  // todo: merge schema's defaultOptions

  //note that creating a new connection useing ...useDb() will reset con.models{},
  //so it is better to pass con as a connection (i.e ..useDn()) instead of dbName (i.e string)
  //if you want to reuse models instead of creating a new one each time
  con = con
    ? typeof con === "string"
      ? mongoose.connection.useDb(con)
      : con
    : mongoose;

  if (con.models[collection]) return con.models[collection];
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
  return con.model(collection, schema);
}

export function encode(str: string) {
  return encodeURIComponent(str); //.replace(/%/g, "%25");
}

export function useDb(dbName: string = "") {
  return mongoose.connection.useDb(dbName).client.db(dbName);
}

export function admin(dbName: string = "") {
  //return new (mongoose.mongo.Admin)((connection || mongoose.connection).db);
  return useDb(dbName).admin();
}

export function dbs(systemDbs = false) {
  return admin()
    .listDatabases()
    .then(dbs =>
      systemDbs
        ? dbs.databases
        : dbs.databases.filter(db => !["admin", "local"].includes(db.name))
    );
}

export function collections(dbName?: string) {
  //mongoose.connection.db.listCollections().toArray()
  return useDb(dbName)
    .listCollections()
    .toArray();
}

/**
 * [backup description]
 * usage: connect(..).then(con=>backup(con,...))
 * @method backup
 * @param  connection the connection returned from mongoose.connect()
 * @param  filter:Filter     a filter strategy for databases/collections/fields to be fetched
 * @return {promise<Data>}   { dbName: { collectionName:{data} }}
 */
export function backup(
  connection, //todo: mongoose.connection || MongoClient
  filter: types.BackupFilter = () => true
): Promise<types.BackupData> {
  //convert [{k:v}] to {k:v}
  let extract = arr =>
    arr.reduce(
      (obj, item) => ({
        ...obj,
        [Object.keys(item)[0]]: item[Object.keys(item)[0]]
      }),
      {}
    );

  return dbs().then(dbs =>
    Promise.all(
      dbs
        .filter(db => filter(db.name))
        .map(async db => ({
          [db.name]: await collections(db.name).then(collections =>
            Promise.all(
              collections
                .filter(coll => filter(db.name, coll.name))
                .map(async coll => ({
                  [coll.name]: {
                    coll,
                    data: await useDb(db.name)
                      .collection(coll.name)
                      .find({})
                      .toArray()
                  }
                }))
            ).then(result => extract(result))
          )

          //.catch(error => ({}))
        }))
    ).then(result => extract(result))
  );
}

/**
 * [restore description]
 * @method restore
 * @param  backupData [description]
 * @return [description]
 *
 * notes:
 * - to insert the data into another database just rename dbName.
 *   ex:
 *       data.backup.newDbName = data.backup.oldDbName
 *       delete data.backup.oldDbName
 *
 */
export function restore(backupData: types.BackupData) {
  for (let dbName in backupData.backup) {
    let con = mongoose.connection.useDb(dbName);
    let db = backupData.backup[dbName];
    for (let collName in db) {
      let coll = db[collName],
        data = coll.data,
        modelOptions = Object.assign(coll.modelOptions || {}, {
          timestamps: true,
          strict: false,
          validateBeforeSave: false
        });

      let dataModel = model(collName, coll.schema || {}, modelOptions, con);
      dataModel
        .insertMany(data)
        .then(() => console.log(`${collName}: inserted`))
        .catch(err => console.error(`error in ${collName}:`, err));
    }
  }
}
