import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { FormBuilder, Validators } from "@angular/forms";
import { Observable } from "rxjs";

export interface obj {
  [key: string]: any;
}

export interface Article extends obj {
  title: string;
  subtitle: string;
  content: string;
  keywords: string | string[];
}
export interface Data {
  type: string; //item|index
  payload: Article | Article[];
}
@Component({
  selector: "app-content",
  templateUrl: "./index.html",
  styleUrls: ["./index.scss"]
})
export class ContentComponent implements OnInit {
  data$: Observable<Data>;

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService
  ) {}
  ngOnInit() {
    this.getData();
  }

  getData() {
    this.route.paramMap.subscribe(params => {
      let item = params.get("item"),
        id;
      if (item) id = item.substring(item.indexOf("-") + 1);
      this.data$ = this.httpService.get<Data>(params.get("type"), id || "");

      console.log({ params });
    });
  }
}
