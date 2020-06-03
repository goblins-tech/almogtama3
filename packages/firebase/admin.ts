//this file is to use firebase-admin SDK with  Nodejs,
//to use firebase client-side (web) use ./firebase.ts
//todo: add typescript definitions ex: upload():Promise<UploadResponse>

/*
todo: issue#
https://github.com/firebase/firebase-functions/issues/540#issuecomment-576598589
https://github.com/googleapis/gax-nodejs/issues/845
https://github.com/googleapis/gax-nodejs/issues/719#issuecomment-605323285

  changed const configData = require('./operations_client_config');
  to const configData = require('./operations_client_config.json');
  in node_modules\google-gax\build\src\operationsClient.js

 */

import * as admin from "firebase-admin";

interface Obj {
  [key: string]: any;
}
interface uploadOptionsObj extends Obj {
  destination?: string;
}
export type uploadOptions = uploadOptionsObj | string;

interface downloadOptionsObj extends Obj {
  destination?: string;
}
export type downloadOptions = downloadOptionsObj | string;
export interface initOptions extends Obj {}

//todo: extends admin
export class Firebase {
  public admin;

  //todo: init app here causes error, admin.initializeApp() must be called from /server.ts
  constructor(options?) {
    this.admin = admin;
    if (options) this.init(options);
  }
  init(options?: initOptions) {
    if (!("credential" in options)) {
      if (options.cert) {
        //note: in this case the cert path must be absolute
        if (typeof options.cert == "string")
          options.cert = require(options.cert);
        options.credential = this.admin.credential.cert(options.cert);
        delete options.cert;
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS)
        options.credential = this.admin.credential.applicationDefault();
    }

    if (options.project) {
      if (!("storageBucket" in options))
        options.storageBucket = `gs://${options.project}.appspot.com`;
      if (!("databaseURL" in options))
        //todo:a duplicate key: options.storageBucket
        options.databaseURL = `https://${options.project}.firebaseio.com`;
    }
    this.admin.initializeApp(options);
  }
  /*
  firebase.initializeApp({
  apiKey: "AIza....",                             // Auth / General Use
  applicationId: "1:27992087142:web:ce....",      // General Use
  projectId: "my-firebase-project",               // General Use
  authDomain: "YOUR_APP.firebaseapp.com",         // Auth with popup/redirect
  databaseURL: "https://YOUR_APP.firebaseio.com", // Realtime Database
  storageBucket: "YOUR_APP.appspot.com",          // Storage
  messagingSenderId: "123456789"                  // Cloud Messaging
});
   */

  storage(bucket?: string) {
    return new Storage(this.admin, bucket);
  }
}

//todo: extends admin.storage
class Storage {
  /**
   * create a new bucket
   * @method constructor
   * @param  bucket  [description]
   */
  //todo: if(bucket instanceof admin.Bucket)this.bucket=bucket
  public bucket;
  constructor(admin, bucket?: string) {
    this.bucket = admin.storage().bucket(bucket); //default bucket
  }

  /**
   * upload a file to the current bucket
   * @method upload
   * @param  file        [description]
   * @param  destination [description]
   * @return Promise<UploadResponse>;  //UploadResponse=[File, API request]
   */
  //todo: upload / download a folder
  upload(file: string | Buffer, options?: uploadOptions) {
    if (typeof options === "string") options = { destination: options };
    //console.log({ file, options });

    //convert base64 to buffer
    if (
      typeof file === "string" &&
      /data:.+\/.+?;base64,([^=]+)={0,2}/.test(file)
    )
      file = Buffer.from(file.replace(/data:.+\/.+?;base64,/, ""), "base64");

    if (typeof file === "string") return this.bucket.upload(file, options);
    else if (file instanceof Buffer) {
      let fileObj = this.bucket.file(options.destination);
      return fileObj.save(file);
    }
  }

  /**
   * download a file
   * @method download
   * @param  file        file path
   * @param  destination [description]
   * @return Promise<DownloadResponse>
   */

  //todo: file: string | File
  download(file, options?: downloadOptions) {
    if (typeof file === "string") file = this.bucket.file(file);
    if (typeof options === "string") options = { destination: options };
    return file.download(options);
  }

  write(file, content: string | Buffer) {}
}
