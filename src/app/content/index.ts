import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { FormBuilder, Validators } from "@angular/forms";
import { Observable } from "rxjs";

export interface Obj {
  [key: string]: any;
}

export interface Article extends Obj {
  title: string;
  subtitle: string;
  content: string;
  keywords: string | string[];
}
export interface Data {
  type: string; //item|index
  payload: Article | Article[];
}

export interface Params extends Obj {
  type: string;
  id?: string;
}

@Component({
  selector: "app-content",
  templateUrl: "./index.html",
  styleUrls: ["./index.scss"]
})
export class ContentComponent implements OnInit {
  data$: Observable<Data>;
  params$: Params;

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService
  ) {}
  ngOnInit() {
    this.getData();
  }

  getData() {
    this.route.paramMap.subscribe(params => {
      //  /jobs/1-title
      let item = params.get("item"),
        id;
      if (item) id = item.substring(item.indexOf("-") + 1) || "";
      this.params$ = { type: params.get("type"), id };

      this.data$ = this.httpService.get<Data>(
        this.params$.type,
        this.params$.id
      );

      console.log({ params });
    });
  }
}
