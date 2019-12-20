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
  files: any;
  progress: Observable<number>;
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
    if (options && options.formData) {
      data = this.toFormData(data);
      delete options.formData;
    }
    return this.http.post<any>(`/api/${type}`, data, options);
  }

  //this method dosent return an Observable
  request(method: string, type: string, data: Obj, options?: Obj) {
    return new HttpRequest(method, `/api/${type}`, data, options);
  }

  toFormData(data): FormData {
    if (data instanceof FormData) return data;
    let formData = new FormData();
    for (let key in data) {
      if (data.hasOwnProperty(key)) formData.append(key, data[key]);
    }
    return formData;
  }

  upload(type, files: Set<File>, fieldName = "file"): Upload {
    //to show the progress for each file separately, each one must be uploaded separately; use upload() for each file alone
    let filesMap: Upload;
    let formData: FormData = new FormData();

    files.forEach(file => {
      formData.append(fieldName, file, file.name);
    });
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

    filesMap = { progress: progress.asObservable(), files: {} };
    formData.forEach((value, key) => {
      filesMap.files[key] = value;
    });

    // return the map of progress.observables
    return filesMap;
  }
}
