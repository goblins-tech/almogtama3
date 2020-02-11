import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpRequest,
  HttpEventType,
  HttpResponse
} from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { environment } from "../environments/environment";

export interface Obj {
  [key: string]: any;
}
const dev = !environment.production;

@Injectable({
  providedIn: "root"
})
export class HttpService {
  constructor(private http: HttpClient) {}
  get<T>(params) {
    var url = "/api/";

    //ex: ~categories
    if (typeof params == "string") url += params;
    else if (params.id) url += `id-${params.id}`;
    else if (params.category) url += encodeURIComponent(params.category);
    return this.http.get<T>(url);
  }

  post(type: string, data: Obj, options: Obj = {}) {
    if (dev) console.log("httpService post", { type, data });
    options = options || {};
    //todo: sending data as FormData instead of Object causes that req.body=undefined
    if (options.formData !== false) data = this.toFormData(data); //typescript 3.2 dosen't support null safe operator i.e: options?.formData
    delete options.formData;
    return this.http.post<any>(`/api/${type}`, data, options);
  }

  //this method dosent return an Observable
  request(method: string, type: string, data: Obj, options?: Obj) {
    return new HttpRequest(method, `/api/${type}`, data, options);
  }

  /**
   * use formData when the form contains files (i.e: multipart), otherwise send the data as a json object
   * note that body-parser doesn't handle multipart data which is what FormData is submitted as.
   * instead use: busboy, formidable, multer, ..
   * https://stackoverflow.com/questions/37630419/how-to-handle-formdata-from-express-4/37631882#37631882
   * @method toFormData
   * @param  data           [description]
   * @param  singleElements append the element as a single entry i.e: JSON.stringify(el)
   * @return FormData
   */
  toFormData(data, singleElements?: string[]): FormData {
    if (data instanceof FormData) return data;

    let formData = new FormData();

    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        let el = data[key];
        if (
          (el instanceof Array || el instanceof FileList) &&
          (!singleElements || !singleElements.includes(key))
        ) {
          //if (!key.endsWith("[]")) key += "[]";
          //FileList.forEach() is not a function
          for (let i = 0; i < el.length; i++) formData.append(key, el[i]);
        } else {
          if (el == null) el = "";
          //formData converts null to "null" , FormData can contain only strings or blobs
          else if (el instanceof Array) el = JSON.stringify(el);
          formData.append(key, el);
        }
      }
    }
    if (dev) console.log("toFormData()", { data, formData });
    return formData;
  }

  //same as post, but reports the progress
  upload(type, data, cb) {
    //to show the progress for each file separately, each one must be uploaded separately; use upload() for each file alone

    return this.post(type, data, {
      reportProgress: true,
      observe: "events"
    }).subscribe(event => {
      if (cb && typeof cb == "function") {
        if (event.type === HttpEventType.UploadProgress)
          cb("progress", event, Math.round((event.loaded * 100) / event.total));
        else if (event.type === HttpEventType.Response) cb("response", event);
      }
    });
  }
}
