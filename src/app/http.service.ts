import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpRequest,
  HttpEventType,
  HttpResponse
} from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { production } from "../environments/environment";

export interface Obj {
  [key: string]: any;
}

@Injectable({
  providedIn: "root"
})
export class HttpService {
  constructor(private http: HttpClient) {}
  get<T>(type: string, id: string) {
    return this.http.get<T>(`/api/${type}/${id}`);
  }

  post(type: string, data: Obj, options: Obj = {}) {
    if (!production) console.log("httpService post", { type, data });
    options = options || {};
    if (options.formData !== false) data = this.toFormData(data); //typescript 3.2 dosen't support null safe operator i.e: options?.formData
    delete options.formData;
    return this.http.post<any>(`/api/${type}`, data, options);
  }

  //this method dosent return an Observable
  request(method: string, type: string, data: Obj, options?: Obj) {
    return new HttpRequest(method, `/api/${type}`, data, options);
  }

  /**
   * [toFormData description]
   * @method toFormData
   * @param  data           [description]
   * @param  singleElements append the element as a single entry i.e: JSON.stringify(el)
   * @return [description]
   */
  toFormData(data, singleElements?: string[]): FormData {
    if (!production) console.log("toFormData:", data);
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
    if (!production)
      console.log({
        formData,
        cover: formData.getAll("cover"),
        "cover[]": formData.getAll("cover[]")
      });
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
