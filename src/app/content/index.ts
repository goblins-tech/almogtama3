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
  params: Params;
  layout = "grid";

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService
  ) {}
  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      //  /jobs/1-title
      var type = params.get("type"),
        item = params.get("item") || "";

      //todo: a workaround for https://github.com/angular/angular/issues/34504
      if (!type) {
        type = item;
        item = "";
      }

      this.params = {
        type,
        id: item.substring(0, item.indexOf("-")) || item //todo: parse as number
      };
      if (this.params.type == "jobs") this.layout = "list";
      this.data$ = this.getData();
      console.log({ params, calculatedParamas: this.params });
    });
  }

  getData() {
    return this.httpService.get<Data>(this.params.type, this.params.id);
  }
}
