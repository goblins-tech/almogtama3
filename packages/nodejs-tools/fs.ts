// todo: create fileSync

import * as fs from "fs";
const fsp = require("fs").promises;
import * as Path from "path";
import { objectType, isEmpty, now, exportAll } from "./general";
import { setTimer, getTimer, endTimer } from "./timer";

export * from "fs";
export * from "path";
export { fsp };

const dev = process.env.NODE_ENV === "development";

export namespace types {
  export enum moveOptionsExisting {
    "replace",
    "rename", // todo: rename pattern ex: {{filename}}({{count++}}).{{ext}}
    "continue", // ignore
    "stop"
  }
  export interface MoveOptions {
    existing: moveOptionsExisting;
  }
  export interface DeleteOptions {
    filesOnly?: boolean; // delete files only, don't delete folders
    keepDir?: boolean; // if false, delete the folder content, but not the folder itself, default=false
    // [name: string]: any;
  }
  export type PathLike = fs.PathLike;
  // = string | Buffer | URL, but URL here refers to typescript/URL not node/URL
}

//exportAll(fs);
//exportAll(Path); // todo: check if there is any conflict betweet fs & path methods
// todo: const fs=Fs(root): auto add root to all paths

/**
 * resolves the path/paths to be absolute and normalize it to guarantee that
 *  the path seperator type of the operating system will be used consistently
 * (e.g. this will turn C:\directory/test into C:\directory\test (when being on Windows)
 * @method path
 * @param  ...paths [description]
 * @return [description]
 */
export function resolve(...paths: types.PathLike[]): string {
  const stringPaths = paths.map(el => el.toString());
  return Path.resolve(Path.normalize(Path.join(...stringPaths))); // if it null it will be the current working dir (of the working script)
}

export function parsePath(path) {
  let extension = ext(path);
  return {
    dir: Path.dirname(path),
    file: Path.basename(path, extension),
    extension,
    type: isDir(path) ? "dir" : "file"
  };
}

/**
 * get file extension
 * @method ext
 * @param  file [file path]
 * @return [description]
 */
export function ext(file: types.PathLike): string {
  if (typeof file != "string") return null;

  // TODO: if(file[0]=='.' && no other ".")return file ex: .gitignore
  return Path.extname(file).toLowerCase(); // todo: remove `.` from extention
  //or: file.split(".").pop().toLowerCase()

  // old: return file.split(".").pop()
}

/**
 * file size
 * @method size
 * @param  file [description]
 * @param  unit [description]
 * @return [description]
 */
export function size(file?: types.PathLike, unit?: "kb" | "mb" | "gb"): number {
  const Size = 123456; // todo: get file size
  if (unit == "kb") {
    return Size / 1024;
  } else if (unit == "mb") {
    return Size / (1024 * 1024);
  } else if (unit == "gb") {
    return Size / (1024 * 1024 * 1024);
  } else {
    return Size;
  }
}

/**
 * check if the given path is a directory
 * @method isDir
 * @param  path  [description]
 * @return [description]
 * @examples:
 * ex1:
 *   if(isDir(path)){ ... }
 * ex2:
 *   idDir(path, dir=>console.log(dir?'directory':'file'))
 */
export function isDir(
  path: types.PathLike,
  cb?: (result: boolean) => void
): boolean | void {
  return !cb
    ? !fs.existsSync(path)
      ? null
      : fs.lstatSync(path).isDirectory()
    : fs.lstat(path, (err, stats) => cb(stats.isDirectory()));
}

// todo: overload: move([ ...[from,to,options] ], globalOptions)
/**
 * moves a file or a directory to a new path
 * @method move
 * @param  path    [path of the file you want to move]
 * @param  newPath [description]
 * @param  options [description]
 * @return [description]
 */
export function move(
  path: types.PathLike,
  newPath: types.PathLike,
  options?: types.MoveOptions,
  cb?: (err) => void
) {
  return !cb ? fs.renameSync(path, newPath) : fs.rename(path, newPath, cb);
  /*
  todo:
   - if isDir(newPath)newPath+=basename(path)
   - bulk: move({file1:newPath1, file2:newFile2}) or move([file1,file2],newPath)
   - move directories and files.
   - if faild, try copy & unlink
   - options.existing:replace|rename_pattern|continue
   */
}

/**
 * last modified time of a file in MS
 * @method mtime
 * @param  file  [description]
 * @return [description]
 */
export function mtime(
  file: types.PathLike,
  cb?: (mtimeMs: number | BigInt) => void
): number | BigInt | void {
  return !cb
    ? fs.statSync(file).mtimeMs
    : fs.stat(file, (err, stats) => cb(stats.mtimeMs));
}

//
// nx:
/*
  options:
  outer: if false, only remove folder contains but don't remove the folder itself (affects folders only)
  files: if true, only remove files (nx: dirs:false|empty false:don't remove dirs, empty=only remove empty dirs)

 options?: { [name: string]: any }
   https://stackoverflow.com/questions/42027864/is-there-any-way-to-target-the-plain-javascript-object-type-in-typescript
 */

/**
 * delete files or folders recursively  https://stackoverflow.com/a/32197381
 * @method delete
 * @param  path    [description]
 * @param  options [description]
 */

export function remove(
  path: types.PathLike | types.PathLike[],
  options?: types.DeleteOptions,
  cb?: (err) => void
): boolean | void {
  /*
   todo:
    - return boolean | {file:boolean} | throw Error
    - check path type (file/folder)
 */
  if (!path) return cb ? cb("no path") : false;
  if (path instanceof Array)
    return path.forEach(p => remove(p as types.PathLike, options, cb));
  path = path as types.PathLike;
  path = resolve(path);
  options = options || {};
  if (!cb) {
    if (fs.existsSync(path)) {
      if (isDir(path))
        fs.readdirSync(path).forEach(file => {
          let curPath = `${path}/${file}`;
          if (isDir(curPath)) {
            if (!options.filesOnly) remove(curPath, options);
          } else fs.unlinkSync(curPath);
        });
      else fs.unlinkSync(path);
      if (!options.keepDir) fs.rmdirSync(path);
    }
  } else {
    //todo: only run cb() one time when all files removed
    fs.access(path, fs.constants.R_OK, err => {
      if (err) return cb(err);
      isDir(path as types.PathLike, dir => {
        if (dir)
          fs.readdir(path as types.PathLike, {}, (err, files) => {
            if (err) return cb(err);
            (files as any).forEach(file => {
              let curPath = `${path}/${file}`;
              isDir(curPath, _isDir => {
                if (_isDir) {
                  if (!options.filesOnly) remove(curPath, options, cb);
                } else fs.unlink(curPath, cb);
              });
            });
            //todo: after removing all files, remove path
            //readdir(path,{},files=>{files.foreach(..); unlink(path)}), use promises
            //https://stackoverflow.com/questions/18983138/callback-after-all-asynchronous-foreach-callbacks-are-completed
            //https://gist.github.com/yoavniran/adbbe12ddf7978e070c0
            //or: remove all files and add dirs to dirs[], then remove all dirs
          });
        else fs.unlink(path as types.PathLike, cb);
      });
    });
  }
}

export function write(file: types.PathLike, data: any, sync: boolean = false) {
  file = resolve(file);
  mdir(file as string, true);
  let dataString = ["array", "object"].includes(objectType(data))
    ? JSON.stringify(data)
    : data;
  //todo: if(JSON.stringify error)->throw error

  return sync
    ? fs.writeFileSync(file, dataString)
    : fsp.writeFile(file, dataString).then(() => ({ data, file }));
}

/**
 * cache data into a file, or read the cache file if the data is fresh
 * @method cache
 * @param  file       [description]
 * @param  data       [description]
 * @param  expire     in hours
 * @param  type       [description]
 * @param  allowEmpty allow creating an empty cache file
 * @return Promise<data:any>;  returns a promise (because some operations executed in async mode) , use await or .then()
  todo:
   strategy -> in case of no valid cache & faild to get data, return:
               - the most recent cache file
               - the nearest valid cache file in files[] array in order
 */
export async function cache(
  files: string | string[], //todo: types.PathLike | types.PathLike[]
  data?: any,
  expire = 0,
  maxAge = 0,
  type?,
  allowEmpty = false
): Promise<any> {
  setTimer("cache");

  if (!(files instanceof Array)) files = [files];
  files = files.map(file => resolve(file));

  if (data === ":purge:")
    return Promise.all(files.map(file => ({ [file]: fsp.unlink(file) })));

  let readCache = function(file) {
    if (!type) {
      if (ext(file) == ".json") type = "json";
      else if (
        //todo: list all media types
        [".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp3", ".mp4"].includes(
          ext(file)
        )
      )
        type = "buffer";
    }

    if (type == "buffer") data = fsp.readFile(file);
    else {
      // without encoding (i.e utf-8) will return a stream instead of a string
      data = fsp.readFile(file, "utf8").then(data => {
        data = data.toString();
        if (type === "json") data = JSON.parse(data);
        return data;
      });
    }

    return data.then(data => {
      if (dev) console.log("[cache] file exists", endTimer("cache"), file);
      return data;
    });
  };

  let filesInfo = {}; //contains exists files only with mtime for each file.

  let _now = now();

  for (let i = 0; i < files.length; i++) {
    if (fs.existsSync(files[i])) {
      filesInfo[files[i]] = mtime(files[i]) as number;

      if (
        expire > -1 &&
        (expire == 0 || filesInfo[files[i]] + expire * 60 * 60 * 1000 > _now)
      )
        return readCache(files[i]);
    }
  }

  //if there is no valid file, run data()
  if (dev) console.log("[cache] refreshing", files[0]);
  mdir(files[0] as string, true);

  //todo: also support rxjs.Observable
  //no need to support Async functions, because it is nonsense if data() function returns another function. (func.constructor.name === "AsyncFunction")
  //todo: await dosen't work if the function returned cache()
  //  ex: cache(file2.txt, ()=>cache(file1.txt, ()=>Promise.resolve('data')).then(data=>'data changed')  )
  //  we get file1.txt from cache, then changed data, then saved the new data into file2.txt
  if (typeof data === "function") data = /* await*/ data();

  let p =
    data instanceof Promise || (data && typeof data.then == "function")
      ? data
      : Promise.resolve(data);

  return p
    .then(data => {
      if (allowEmpty || !isEmpty(data)) write(files[0], data);
      if (dev)
        console.log("[cache] refereshed in", endTimer("cache"), files[0]);
      return data; //todo: return write()
    })
    .catch(error => {
      if (dev)
        console.warn(
          "[cache] faild to refresh the cache" +
            (maxAge > -1
              ? ", trying to get data from any valid cache file"
              : ""),
          getTimer("cache"),
          error
        );

      if (maxAge > -1) {
        for (let k in filesInfo) {
          if (maxAge == 0 || filesInfo[k] + maxAge * 60 * 60 * 1000 > _now)
            return readCache(k);
        }
      }

      return Promise.reject("[cache] cannot fetch any data");
    });
}

export function mdir(path: string | string[], file = false) {
  if (path instanceof Array) {
    let result = {};
    path.forEach(el => {
      result[el.toString()] = mdir(el, file);
    });
    return result;
  }
  if (file) path = Path.dirname(path);
  fs.existsSync(path) || fs.mkdirSync(path, { recursive: true });
}

//todo: replace with read() & write()
export let json = {
  read(file: string) {
    if (!file) return null;
    var data = fs.readFileSync(file).toString();
    return JSON.parse(data || null);
  },
  write(file: string, data: any, cb?) {
    return write(file, data, cb);
  },
  convert(data: any) {
    if (typeof data == "string") {
      if (ext(data) == ".json") return this.read(data);
      if (data.trim().charAt(0) == "{") return JSON.parse(data) || null;
    } else {
      return JSON.stringify(data);
    }
  }
};

/*
todo:
- extend the native "fs": add methods to it (i.e: fs.newMethod=fn(){..}) then re export it
- add this.root to paths in all methods
- provide file path to all methods, to avoid creating a new instance for every file
  i.e new file(path).size() -> new file().size(path)
  if path didn't provided, this.filePath will be used
*/
/*
export class Files {
//accepts the root path as the root base for all paths in this class
  constructor(public root: types.PathLike) {
    console.log("===Files()==="); //todo: remove all logs, use unit test
    this.root = this.path(root);
    return this;
  }
}
*/
