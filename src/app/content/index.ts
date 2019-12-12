import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { FormBuilder, Validators } from "@angular/forms";
import { Observable } from "rxjs";

export interface Params {
  type: string;
  id?: string;
}
@Component({
  selector: "app-content",
  templateUrl: "./index.html",
  styleUrls: ["./index.scss"]
})
export class ContentComponent implements OnInit {
  params: Params;
  data: Observable<Object>;
  form;
  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private formBuilder: FormBuilder
  ) {}
  ngOnInit() {
    this.getData();
  }

  getData() {
    this.route.paramMap.subscribe(params => {
      //this.params = { type: params.get("type"), id: params.get("item") };
      this.data = this.httpService.get(params.get("type"), params.get("item"));

      console.log({
        item: params.get("item"),
        optional: params.get("optional"),
        params
      });
    });
  }
}
