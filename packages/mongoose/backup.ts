import { connect, types, model } from "./index";
import { objectType } from "../nodejs-tools/general";
export type Connection = types.uri | [types.uri, types.ConnectionOptions]; //todo:| instanceof connect
export type backupData = {
  collection: string;
  data: {};
  schema?: {};
  options?: {};
};

/* todo:
export type Filter =
  | string
  | any[]
  | {}
  | ((type: string, name: string, args: [string, string, {}]) => boolean);
*/
export type Filter = any;
export type Cb = (type: string, data: any) => void;

/**
 * [backup description]
 * @method backup
 * @param  connection uri | [uri,options]
 * @param  cb         a callback function whitch called after every fetching
 * @param  filter     a filter strategy for databases/collections/fields to be fetched
 * @return {promise}
 */
export function backup(connection: Connection, cb: Cb, filter: Filter) {
  return _connect(connection).then(con => {
    console.log(`> host: ${con.s.options.srvHost}`);
    cb("connection", con);

    let filterStrategy = {}; //todo: Promise()
    if (!filter || objectType(filter) == "function") {
      //get dbs by query, then use filter()
      if (!filter) filter = () => true; //include all dbs, collections, fields
      con
        .db()
        .admin()
        .listDatabases()
        .then(dbs => {
          dbs.databases.forEach(db => {
            if (["admin", "local"].includes(db.name) || !filter("db", db.name))
              return;
            cb("db", db);

            db.listCollections()
              .toArray()
              .then(collections => {
                collections.forEach(collection => {
                  if (!filter("collection", collection.name)) return;
                  cb("collection", { dbName: db.name, collection });
                  //todo, find() args
                  getData(db, collection.name)
                    .then(data =>
                      cb("data", {
                        dbName: db.name,
                        collection: collection.name,
                        data
                      })
                    )
                    .catch(err =>
                      console.error(
                        `error @find() collection:${collection.name}`,
                        { err }
                      )
                    );
                });
              });
          });
        });
    } else {
      if (typeof filter == "string") {
        if (filter.charAt(0) == "!")
          //excluding list
          filter
            .split(",")
            .splice(1) //remove the first element (i.e: '!')
            .forEach(el => (filterStrategy[el] = false));
        else filter.split(",").forEach(el => (filterStrategy[el] = true));
      } else if (["array", "set"].includes(objectType(filter)))
        filter.forEach(el => (filterStrategy[el] = true));
      else if (objectType(filter) == "object") filterStrategy = filter;
    }

    //todo: loop throgh filterStrategy{}
  });
}

//todo: ,... find() args
function getData(db, collection: string) {
  return db
    .collection(collection)
    .find({})
    .toArray();
}

export function restore(connection: Connection, data: backupData[]) {
  return _connect(connection).then(() => {
    console.log(">[restore] connected");

    data.forEach(el => {
      el.options = Object.assign(el.options || {}, {
        timestamps: true,
        strict: false,
        validateBeforeSave: false
      });

      let dataModel = model(el.collection, el.schema || {}, el.options);
      dataModel
        .insertMany(el.data)
        .then(() => console.log(`${el.collection}: inserted`))
        .catch(err => console.error(`error in ${el.collection}:`, err));
    });
  });
}

function _connect(connection: Connection) {
  let con =
    connection instanceof Array
      ? connect(...connection)
      : typeof connection == "string"
      ? connect(connection)
      : connection; //todo: instanceof connect?connection:null;

  if (!con) throw new Error("invalid connection");

  console.log("> connected");
  return con;
}
