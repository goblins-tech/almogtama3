import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { Observable } from "rxjs";
import { MatSnackBar } from "@angular/material";
import { Data } from "./index"; //todo: use tripple directive i.e: ///<reference types="./index.ts" />
import { article } from "./formly";
import { HighlightJS } from "ngx-highlightjs";

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
  response;
  submitting = false;
  articleForm;
  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private snackBar: MatSnackBar,
    private hljs: HighlightJS
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

      //change content.type from textarea to quill
      let content =
        article.fields[article.fields.findIndex(el => el.key == "content")];
      content.type = "quill";
      if (!content.templateOptions)
        content.templateOptions = { label: "content" };
      content.templateOptions["modules"] = {
        toolbar: [
          ["bold", "italic", "underline", "strike"],
          ["blockquote", "code-block"],
          [{ header: [false, 2, 3, 4] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ script: "sub" }, { script: "super" }],
          [{ direction: ["rtl", "ltr"] }],
          [{ size: ["small", false, "large"] }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ["link", "image", "video"],
          ["clean"]
        ]
        //,syntax: true //->install highlight.js or ngx-highlight
      };

      if (this.params.type == "jobs") {
        //delete cover image since jobs.layout=="list" not grid
        //dont use delete article.fields(...)
        article.fields.splice(
          article.fields.findIndex(el => el.type == "file"),
          1
        );

        article.fields.push({
          key: "pictures",
          type: "file",
          templateOptions: {
            label: "Pictures",
            description: "Upload some nice pictures",
            required: true
          }
        });

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
      console.log({ articleForm: article });
    });
  }

  getData() {
    return this.httpService.get<Data>(this.params.type, this.params.id);
  }

  onSubmit(data) {
    //todo: data.files=this.upload() or: submit().subscribe(data=>upload())

    //todo: data.files= {cover: #cover.files.data}

    console.log("content.ts onSubmit()", data);
    this.submitting = true;
    let files = this.articleForm.fields.filter(el => el.type == "file"); //todo: articleForm.form.get('cover').files?
    this.httpService.upload(this.params.type, data, (type, event, value) => {
      if (type == "progress") this.progress = value;
      //todo: send to articleForm.fields[type=file]
      else if (type == "response") {
        console.log("response", event.body);
        this.submitting = false;
        this.response = event.body;
        this.showSnackBar(
          event.body.ok ? "form submitted" : "Error " + event.body.msg || "",
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
