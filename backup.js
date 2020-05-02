//todo: use pkg/mongoose/backup (compile with ts)

const mongo = require("mongodb");
const mongoose = require("mongoose");
const MongoClient = mongo.MongoClient;
const fs = require("fs");

exports.backup = function(dbs, globalCollections, options, dbName) {
  //todo: models[], outputPath
  //dbs = 'dbList' | '!dbList' | {db:collections} | 'all' | null -> 'all' (stings or regex)
  //dbList: db1,db2,...
  //collections (overrides globalCollections)= 'collectionList' | '!collectionList' | {collection:'fields' | '!fields'}
  //options.strategy = 'merge' | 'replace': how collectionList overrides globalCollections
  //returns {data}; doesn't write to the disk

  //todo: use function params to control whitch dbs, collections to backup
  //MongoClient.connect(url)
  connect(
    url,
    dbName
  ).then(
    con => {
      let opt = con.s.options; //connection options
      let now = new Date().toISOString().replace(":", " ");
      console.log("> connected");
      console.log(`> host: ${opt.srvHost}`);

      con
        .db()
        .admin()
        .listDatabases()
        .then(dbs =>
          dbs.databases.forEach(el => {
            if (["admin", "local"].includes(el.name)) return;
            console.log(`> db: ${el.name}`);
            let dir = `./${opt.srvHost}/${el.name}/${now}`; //todo: if(srv)
            fs.mkdirSync(dir, { recursive: true });
            //todo: if(output)
            fs.writeFileSync(`${dir}/__db.json`, JSON.stringify(con.s));
            let db = con.db(el.name);
            db.listCollections()
              .toArray()
              .then(collections =>
                collections.forEach(coll => {
                  console.log(`>> ${coll.name}`);
                  db.collection(coll.name)
                    .find({})
                    .toArray()
                    .then(data => {
                      //todo: if file exists: merge | replace
                      fs.writeFileSync(
                        `${dir}/${coll.name}.json`,
                        JSON.stringify({ data, coll })
                      );
                    })
                    .catch(err =>
                      console.error(`error @find() col:${coll.name}`, { err })
                    );
                })
              )
              .catch(err => console.error("error @listCollections:", { err }));
          })
        );
    },
    err => console.log("connection error:", { err })
  );
};

/**
 * restore the database
 * @method restore
 * @param  {string} dir      data directory
 * @param  {string} dbName   [optional] default: __db.options.dbName
 * @param  {function(file)=>boolean} filter   [optional] a function to filter files to include in the restore
 * @param  {function(file)=>[file,data]} convert  [optional] a function to
 * @return
 *
 * options{
 *   dir {string} data directory
 *   dbName? {string} default: __db.options.dbName
 *   url? {string} default: __db.url
 *   filter? {function(file)=>boolean} filter data files
 *   convert? {function(file)=>[file,data]}  convert the data of each file to be restored
 *   getSchema? {function(file)=>schema{}}  schema object for mongoose model, default: (file)=>{}
 * }
 */
exports.restore = function(options) {
  const db = readJson(`${options.dir}/__db`) || { options: {} };
  let opt = Object.assign(
    {
      url: db.url,
      dbName: db.options.dbName,
      filter: file => true,
      convert: file => [file, readJson(`${opt.dir}/${file}`)],
      getSchema: file => ({}) //just an empty schema
    },
    options || {}
  );
  console.log({ options });
  if (!opt.url || !opt.dbName) return console.error("error: no url or dbName");

  connect(
    opt.url,
    opt.dbName
  ).then(() => {
    console.log("> connected");

    fs.readdirSync(opt.dir)
      .filter(
        file =>
          file.includes(".json") &&
          file != "__db.json" &&
          !fs.lstatSync(`${opt.dir}/${file}`).isDirectory()
      )
      .map(file => file.replace(".json", ""))
      .filter(opt.filter)
      .map(opt.convert)
      .forEach(([file, data]) => {
        let schema = new mongoose.Schema(opt.getSchema(file), {
          timestamps: true,
          strict: false,
          validateBeforeSave: opt.validate || false
        });
        let model = mongoose.model(file, schema);
        model
          .insertMany(data)
          .then(() => console.log(`${file}: inserted`))
          .catch(err => console.error(`${file}: error`, err));
      });
  });
};

function readJson(path) {
  if (!fs.existsSync(`./${path}.json`)) return null;
  let dataString = fs.readFileSync(`./${path}.json`).toString();
  let data = JSON.parse(dataString);
  return data.data || data;
}
exports.readJson = readJson;

function saveJson(path, data) {
  fs.writeFileSync(`${path}.json`, JSON.stringify(data));
}
exports.saveJson = saveJson;

function connect(url, dbName) {
  console.log("> connecting...");
  const defaultOptions = {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    bufferCommands: false,
    autoIndex: false,
    useUnifiedTopology: true,
    retryWrites: true,
    w: "majority"
  };

  return mongoose.connect(url, { dbName, ...defaultOptions });
}
exports.connect = connect;
