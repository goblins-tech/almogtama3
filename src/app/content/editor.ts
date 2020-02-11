import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { MatSnackBar } from "@angular/material";
import { Data } from "./index"; //todo: use tripple directive i.e: ///<reference types="./index.ts" />
import { article } from "./formly";
import { HighlightJS } from "ngx-highlightjs";
import { keepHtml, Categories } from "./functions";
import { urlParams } from "../../../eldeeb/angular";
import { environment as env } from "../../environments/environment";
import {
  AngularFireStorage,
  AngularFireStorageReference,
  AngularFireUploadTask
} from "@angular/fire/storage"; //todo: move to server.ts (how to inject AngularFireStorage?)
import { DomSanitizer } from "@angular/platform-browser";
import { FieldType } from "@ngx-formly/material";

export interface Params {
  type: string; //todo: movr to query i.e: editor/?type=jobs
  id?: string;
}
const dev = !env.production;

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
    private hljs: HighlightJS,
    private storage: AngularFireStorage,
    private sanitizer: DomSanitizer
  ) {}
  ngOnInit() {
    this.getCategories().subscribe(ctg => {
      if (typeof ctg.data == "string") ctg.data = JSON.parse(ctg.data); //todo: why response: string
      console.log({ ctg });
    });

    //todo: if($_GET[id])getData(type,id)
    //ex: /editor?type=jobs or /editor:id
    urlParams(this.route).subscribe(([params, query]) => {
      this.params = {
        id: params.get("id") || "",
        type: query.get("type") || ""
      };

      //set the default type
      if (!this.params.id && !this.params.type) this.params.type = "articles";

      /*
    todo: if(id){
            - getData()
            - get this.params.type from getData().type
          }
     */

      //todo: fix getData()
      //if (this.params.id != "") this.data$ = this.getData();
      if (dev) console.log({ params, query, calculatedParamas: this.params });

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

        article.fields.push(
          {
            key: "pictures",
            type: "file",
            templateOptions: {
              label: "Pictures",
              description: "Upload some nice pictures",
              required: true
            }
          },
          {
            key: "test",
            template: keepHtml(`test: <input type="text" />`),
            templateOptions: {
              label: "test",
              description: "test using keepHtml",
              required: true
            }
          }
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

        //todo: add fields: required experience, salary,
        // job type (ex: full time), location{}, company{}, required skills,
        //application deadline (date), ..

        //todo: categories = sub of jobs, main category = jobs

        //todo: if(form.content contains contacts)error -> email, mobile, link
      } else {
        article.fields.push({
          key: "test",
          //https://github.com/ngx-formly/ngx-formly/issues/2039#issuecomment-583890544
          //https://stackoverflow.com/a/53188651
          template: this.sanitizer.bypassSecurityTrustHtml(`label: <input>`)[
            "changingThisBreaksApplicationSecurity"
          ],
          templateOptions: {
            label: "test"
          }
        });
      }
      this.articleForm = article;
      console.log({ articleForm: article });
    });
  }

  getData() {
    return this.httpService.get<Data>({
      id: this.params.id
    });
  }

  getCategories() {
    return this.httpService.get<any>("~categories");
  }

  onSubmit(data) {
    //todo: data.files=this.upload() or: submit().subscribe(data=>upload())
    //todo: data.files= {cover: #cover.files.data}
    //todo: send base64 data from data.content to firebase storage

    console.log("content.ts onSubmit()", data);
    this.submitting = true;
    let files = this.articleForm.fields.filter(el => el.type == "file"); //todo: articleForm.form.get('cover').files?
    //todo: app.post("/api/",data)
    this.httpService.upload(this.params.type, data, (type, event, value) => {
      if (type == "progress") this.progress = value;
      //todo: send to articleForm.fields[type=file]
      else if (type == "response") {
        console.log("response", event.body);
        this.response = event.body;
        this.submitting = false;
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

  /*  upload(file) {
    //file= base64 data or file from <input file>
    //todo: file name ex: shortid/data.slug
    let id = Math.random()
      .toString(36)
      .substring(2);
    let storageRef: AngularFireStorageReference = this.storage.ref(id);
    let storageTask: AngularFireUploadTask = storageRef.put(file);
    let uploadProgress: Observable<number> = storageTask.percentageChanges();
    let downloadURL: Observable<string> = await storageTask.downloadURL();
    let uploadState: Observable<string> = storageTask
      .snapshotChanges()
      .pipe(map(s => s.state));

    //you can use storageTask.pause(), storageTask.cancel(), storageTask.resume()
    //ex: <btn (click)=>storageTask.cancel() *ngIf="uploadState=='running' || uploadState=='paused'">
    //todo: this.storageTask for each file upload
    //todo: add progress bar under each image
  } */

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

//todo: use template:Categories.createInputs() instead of type=FormlyFieldCategories
@Component({
  selector: "formly-field-file",
  template: ``
})
export class FormlyFieldCategories extends FieldType implements OnInit {
  inputs;
  ngOnInit() {
    /*
    if(jobs)ctg=''
    this.http.get('~categories').subscribe(ctgs=>new Categories(ctgs).createInputs(ctg, "", execlude))
     */
  }
  createInputs(ctg, execlude) {
    //ContentEditorComponent.getCategories().then(data=>data.inputs)
  }
}
