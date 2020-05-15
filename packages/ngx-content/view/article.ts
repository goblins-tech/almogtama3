import { Component, Input, OnInit } from "@angular/core";

interface Obj {
  [key: string]: any;
}

export interface Article extends Obj {
  id?: string;
  title?: string;
  subtitle?: string;
  content?: string;
  keywords?: string | string[]; //todo: if(string)..
  cover?: string;
  author?: { name?: string; img?: string; link?: string };
  link?: string;
  [key: string]: any; //ex: _id,...
}

export interface Pref extends Obj {
  layout?: string; //grid || list
  back?: string; //the link in case of no content
  noContent?: string; //noContent text; todo: html
}

@Component({
  selector: "ngx-content-article",
  templateUrl: "./article.html",
  styleUrls: ["./view.scss"]
})
export class NgxContentArticleComponent {
  @Input() data: Article;
  @Input() type: string;
}
