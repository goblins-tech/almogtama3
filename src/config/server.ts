import { credential } from "firebase-admin";
import * as schemas from "./models";
import { existsSync } from "fs";
import { join } from "path";

export const dev = process.env.NODE_ENV === "development";
export const TEMP = join(process.env.INIT_CWD || "", "./temp"); //todo: use system.temp
export const DIST = join(process.env.INIT_CWD || "", "./dist"); //process.cwd() dosen't include /dist
export const indexHtml = existsSync(join(DIST, "index.original.html"))
  ? "index.original.html"
  : "index";
export const BUCKET = `${dev ? "test" : "almogtama3.com"}`;
export { schemas };

//todo: envrypt all sensetive data, or use ${{env:keyName}}

export const DB = {
  type: "mongodb",
  auth: ["xxyyzz2050", "Xx159753@@"], //todo: ['username', 'env:dbPass']
  host: "almogtama3-gbdqa.gcp.mongodb.net",
  srv: true,
  dbName: dev ? "test" : "almogtama3"
};
