import { Component, Input, OnInit } from "@angular/core";

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

export interface Pref extends Obj {
  layout?: string; //grid || list
  back?: string; //the link in case of no content
  noContent?: string; //noContent text; todo: html
}

@Component({
  selector: "content-article",
  templateUrl: "./article.html",
  styleUrls: ["./view.scss"]
})
export class NgxContentArticleComponent {
  @Input("data") data: Article;
}
