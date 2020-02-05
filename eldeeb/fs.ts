// todo: create fileSync

import fs from "fs";
import Path from "path";
import { objectType, isEmpty, now, exportAll } from "./general";

export * from "fs";
export * from "path";

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
    files?: boolean; // delete files only, dont delete folders
    keepDir?: boolean; // if false, delete the folder content, but not the folder itself, default=false
    // [name: string]: any;
  }
  export type PathLike = import("fs").PathLike;
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
 */
export function isDir(path: types.PathLike): boolean {
  return fs.lstatSync(path).isDirectory(); // todo:
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
  options?: types.MoveOptions
): {} {
  // let destination = this.isDir(path) ? newPath : Path.dirname(newPath); //todo: ??
  fs.renameSync(path, newPath); // todo: when removing URL from path types, error solved i.e: move(path:string|Buffer,..), why?
  /*TODO:
     - if faild, try copy & unlink
     - options.existing:replace|rename_pattern|continue
     - accept multiple files: move([file1,file2],newPath), move({file1:newPath1,...})
   */
  return {}; // todo: return a result
}

/**
 * last modified time of a file in MS
 * @method mtime
 * @param  file  [description]
 * @return [description]
 */
export function mtime(file: types.PathLike): number | bigint {
  return fs.statSync(file).mtimeMs;
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
  path: types.PathLike,
  options?: types.DeleteOptions
): void {
  /*
   todo:
    - return boolean
    - check path type (file/folder)
 */
  if (!path) {
    return;
  }
  path = resolve(path);
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(file => {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) {
        if (!options.files) {
          remove(curPath);
        }
      } else {
        fs.unlinkSync(curPath);
      }
    });
    if (!options.keepDir) {
      fs.rmdirSync(path);
    }
  }
}

/**
 * cache data into a file, or read the cache file if the data is fresh
 * @method cache
 * @param  file       [description]
 * @param  data       [description]
 * @param  expire     in hours
 * @param  type       [description]
 * @param  allowEmpty [description]
 * @return Promise<data:any>
 */
export async function cache(
  file: types.PathLike,
  data?: any,
  expire = 0,
  json = false,
  allowEmpty = false
) {
  /*  returns a promise (because some operations executed in async mode) , use await or .then()
       allowEmpty: allow creating an empty cache file
       expire (hours)
   */
  file = resolve(file);
  if (data === ":purge:") return fs.unlink(file, () => {}); //purging the cache; not a promise

  if (process.env.NODE_ENV == "development")
    //console.log("cache():", { file, data });
    mdir(file as string, true);
  if (ext(file) == ".json") json = true;
  if (
    !fs.existsSync(file) ||
    expire < 0 ||
    (!isNaN(expire) && // if not a number consider it as epire=0 i.e: never expires
    expire != 0 && // if expire=0 never expires
      (mtime(file) as number) + expire * 60 * 60 * 1000 < now()) // todo: convert mimetime() to number or convert expire to bigInt??
  ) {
    //console.log("cache: new data");
    function cache_save(data) {
      //console.log("cache_save:", data);
      if (["array", "object"].includes(objectType(data)))
        data = JSON.stringify(data);

      if (allowEmpty || !isEmpty(data)) fs.writeFileSync(file, data);
      return data;
    }
    //todo: also support rxjs.Observable
    //no need to support Async functions, because it is nonsense if data() function returns another function. (func.constructor.name === "AsyncFunction")
    if (typeof data == "function") data = await data();
    //console.log("cache data()", data);
    if (data && (data instanceof Promise || typeof data.then == "function"))
      return data.then(data => cache_save(data));
    else return new Promise(r => r(cache_save(data)));

    // todo: do we need to convert data to string? i.e: writeFileSync(file.toString()), try some different types of data
  } else {
    //console.log("cache: old data", { json });
    // retrive data from file and return it as the required type
    data = fs.readFileSync(file, "utf8").toString(); // without encoding (i.e utf-8) will return a stream insteadof a string
    if (json) data = JSON.parse(data);
    //console.log({ cach_data: data });
    return new Promise(r => r(data));
    // todo: elseif(type=="number") elseif ...
  }
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

export let json = {
  read(file: string) {
    if (!file) return null;
    var data = fs.readFileSync(file).toString();
    return JSON.parse(data || null);
  },
  write(file: string, data: any) {
    if (data) {
      mdir(file, true);

      if (["array", "object"].includes(objectType(data)))
        data = JSON.stringify(data);
      fs.writeFileSync(file, data);
    }
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
