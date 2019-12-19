import { Injectable } from "@angular/core";
import {
  HttpClient,
  HttpRequest,
  HttpEventType,
  HttpResponse
} from "@angular/common/http";
import { Observable, Subject } from "rxjs";

export interface Obj {
  [key: string]: any;
}

export interface Upload {
  [key: string]: { progress: Observable<number> };
}

@Injectable({
  providedIn: "root"
})
export class HttpService {
  constructor(private http: HttpClient) {}
  get<T>(type: string, id: string) {
    return this.http.get<T>(`/api/${type}/${id}`);
  }

  post(type: string, data: Obj, options?: Obj) {
    console.log("httpService post", { type, data });
    return this.http.post<any>(`/api/${type}`, data, options);
  }

  //this method dosent return an Observable
  request(method: string, type: string, data: Obj, options?: Obj) {
    return new HttpRequest(method, `/api/${type}`, data, options);
  }

  upload(type, files: Set<File>): Upload {
    let filesMap: Upload = {};

    files.forEach(file => {
      // create a new multipart-form for every file
      let formData: FormData = new FormData();
      formData.append("file", file, file.name);

      let req = this.request("POST", type, formData, { reportProgress: true });

      // create a new progress-subject for every file
      let progress = new Subject<number>();

      // send the http-request and subscribe for progress-updates
      this.http.request(req).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          // calculate the progress percentage, and pass it to the progress-stream
          progress.next(Math.round((event.loaded * 100) / event.total));
        } else if (event instanceof HttpResponse) {
          // if we get an answer form the API,The upload is complete & Close the progress-stream
          progress.complete();
        }
      });

      filesMap[file.name] = {
        progress: progress.asObservable()
      };
    });

    // return the map of progress.observables
    return filesMap;
  }
}
