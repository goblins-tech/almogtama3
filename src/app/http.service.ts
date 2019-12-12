import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

export interface Obj {
  [key: string]: any;
}
@Injectable({
  providedIn: "root"
})
export class HttpService {
  constructor(private http: HttpClient) {}
  get(type: string, id: string) {
    return this.http.get(`/api/${type}/${id}`);
  }

  post(type: string, data: Obj) {
    console.log("httpService post", { type, data });
    return this.http.post<any>(`/api/${type}`, data);
  }
}
