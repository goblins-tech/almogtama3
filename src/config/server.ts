import { credential } from "firebase-admin";
import * as schemas from "./models";
import { join } from "pkg/nodejs-tools/fs";

export const dev = process.env.NODE_ENV === "development";
export const BROWSER = join(process.env.INIT_CWD || "", "./dist/browser"); //process.cwd() dosen't include /dist
export const MEDIA = join(process.env.INIT_CWD || "", "./temp/media"); //don't save media files inside dist, as dist may be deleted at any time
export const BUCKET = `${dev ? "test" : "almogtama3.com"}`; //todo: $config.domain/media
export { schemas };

export const FIREBASE = {
  credential: credential.cert(require("./firebase-almogtama3-eg.json")),
  storageBucket: `gs://almogtama3-eg.appspot.com`
};

export const DB = {
  type: "mongodb",
  auth: ["xxyyzz2050", "Xx159753@@"], //todo: ['username', 'env:dbPass']
  host: "almogtama3-gbdqa.gcp.mongodb.net",
  srv: true,
  dbName: dev ? "test" : "almogtama3"
};
