import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { Observable } from "rxjs";
import { MatSnackBar } from "@angular/material";
import { Data } from "./index"; //todo: use tripple directive i.e: ///<reference types="./index.ts" />
import { article } from "./formly";

export interface Params {
  type: string;
  id?: string;
}

@Component({
  selector: "app-content",
  templateUrl: "./editor.html",
  styleUrls: ["./editor.scss"]
})
export class ContentEditorComponent implements OnInit {
  params: Params;
  data$: Observable<Object>;

  //uploading vars
  @ViewChild("file", { static: false }) file; //access #file DOM element
  @ViewChild("formElement", { static: false }) formElement;
  files = []; //Set<File> = new Set();
  progress;
  msg = "";
  articleForm;
  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private snackBar: MatSnackBar
  ) {}
  ngOnInit() {
    //todo: if($_GET[id])getData(type,id)
    this.route.paramMap.subscribe(params => {
      this.params = {
        type: params.get("type"),
        id: params.get("id") || ""
      };

      if (this.params.id != "") this.data$ = this.getData();
      console.log({ params, calculatedParamas: this.params });

      if (this.params.type == "jobs") {
        //delete cover image since jobs.layout=="list" not grid
        //dont use delete article.fields(...)
        article.fields.splice(
          article.fields.findIndex(el => el.type == "file"),
          1
        );

        //add field:contacts after content
        article.fields.splice(
          article.fields.findIndex(el => el.key == "content") + 1,
          0,
          {
            key: "contacts",
            type: "textarea",
            templateOptions: {
              label: "contacts",
              required: false,
              rows: 2
            }
          }
        );
      }
      this.articleForm = article;
      console.log({ article });
    });
  }

  getData() {
    return this.httpService.get<Data>(this.params.type, this.params.id);
  }

  onSubmit(data) {
    //todo: data.files=this.upload() or: submit().subscribe(data=>upload())

    //todo: data.files= {cover: #cover.files.data}

    console.log("content.ts onSubmit()", data);
    this.httpService.upload(this.params.type, data, (type, event, value) => {
      if (type == "progress") this.progress = value;
      //todo: send to articleForm.fields[type=file]
      else if (type == "response") {
        console.log(event.body);
        if (event.body!.ok) this.msg = "ok";
        else this.msg = event.body!.msg;
        this.showSnackBar(
          this.msg == "ok" ? "form submitted" : this.msg,
          "close",
          3000
        );
        //this.uploadedFiles=event.body;
        this.articleForm.form.reset();
        this.formElement.reset(); //https://stackoverflow.com/a/49789012/12577650; also see create.html
        //  this.files.clear();
        this.files = [];
      }
    });
  }

  isValid(field: string) {
    return (
      !this.articleForm.get(field).touched ||
      !this.articleForm.get(field).hasError("required")
    );
  }
  getErrorMessage(_field: string, name?: string) {
    let field = this.articleForm.get(_field);

    if (field.hasError("required")) {
      if (name) return `${name} is required`;
      else return "You must enter a value";
    }

    return field.hasError("email") ? "Invalid email" : "";
  }

  showSnackBar(message: string, action: string, duration = 0) {
    this.snackBar.open(message, action, { duration });
  }
}
