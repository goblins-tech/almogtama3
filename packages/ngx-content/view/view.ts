import { Component, Input, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { QuillViewComponent } from "ngx-quill"; //todo: enable sanitizing https://www.npmjs.com/package/ngx-quill#security-hint

/*
- usage:
<content-view [data]="{title,content,keywords[],auther{},...}" [related]="[{id,title,..}]" >
*/

interface Obj {
  [key: string]: any;
}

export interface Article extends Obj {
  id?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  keywords?: string | string[];
  cover?: string;
  avatar?: string;
  link?: any;
  auther?: any; //todo
  [key: string]: any; //ex: _id,...
}
export interface Data {
  type: string; //item || list -> todo: if(payload: Array)type=list
  payload: Article | Article[];
}

export interface Pref extends Obj {
  layout?: string; //grid || list
}

@Component({
  selector: "content-view",
  templateUrl: "./view.html",
  styleUrls: ["./view.scss"]
})
export class NgxContentViewComponent implements OnInit {
  @Input("data") dataObj: Data | Observable<Data>;
  @Input() pref: Pref; //component prefrences
  data: Data;

  ngOnInit() {
    /*
    note: if dataObj is Observable, so it is exists but !dataObj.payload,
          so it will show #noContent block instead of #loading
          that's why we use another object `data`, as it will not exists until
          the observable has been settled

     */
    if (this.dataObj instanceof Observable)
      this.dataObj.subscribe(data => {
        this.data = data;
      });
    else this.data = this.dataObj;
  }
}
