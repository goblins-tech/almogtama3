import { Component, Input, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import { QuillViewComponent } from "ngx-quill"; //todo: enable sanitizing https://www.npmjs.com/package/ngx-quill#security-hint
import { obs } from "pkg/ngx-tools";
import { Article, Pref } from "./article";
/*
- usage:
<content-view [data]="{title,content,keywords[],auther{},...}" [related]="[{id,title,..}]" >
*/

export type Data = Article | Article[];
export interface DataObj {
  type?: string;
  payload: Data;
}

@Component({
  selector: "content-view",
  templateUrl: "./view.html",
  styleUrls: ["./view.scss"]
})
export class NgxContentViewComponent implements OnInit {
  @Input() data: Data | Observable<Data>;
  @Input() pref: Pref; //component prefrences
  dataObj: DataObj;

  ngOnInit() {
    this.pref = this.pref || {};

    //todo: pref.back=/$item.categories[0]
    this.pref.back = this.pref.back || "/";

    obs(this.data, data => {
      //if (typeof data == "string") data = JSON.parse(data);
      if (data instanceof Array) {
        if (data.length > 0) this.dataObj = { type: "list", payload: data };
      } else {
        //object
        if (!data.error || Object.keys(data).length > 0)
          this.dataObj = { type: "item", payload: data };
        else this.dataObj = { payload: null };
      }
    });
  }
}
