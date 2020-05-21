import { Component, OnInit, ViewChild, Input } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { HttpEvent, HttpEventType } from "@angular/common/http";
import { Observable, of, forkJoin } from "rxjs";
import { map, concatMap } from "rxjs/operators";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Article } from "pkg/ngx-content/view"; //todo: use tripple directive i.e: ///<reference types="./index.ts" />
import { HighlightJS } from "ngx-highlightjs";
import { keepHtml, Categories } from "./functions";
import { urlParams } from "pkg/ngx-tools/routes";
import env from "../../env";
import {
  AngularFireStorage,
  AngularFireStorageReference,
  AngularFireUploadTask
} from "@angular/fire/storage"; //todo: move to server.ts (how to inject AngularFireStorage?)
import { DomSanitizer } from "@angular/platform-browser";
import { FieldType } from "@ngx-formly/material";
import {
  FormObj,
  Response,
  Progress,
  NgxFormComponent,
  article
} from "pkg/ngx-form";

/*
//for FormlyFieldCategories; https://stackoverflow.com/a/60267178/12577650
import {
  ComponentFactoryResolver,
  Renderer2,
  ViewContainerRef
} from "@angular/core";
import { MatCheckbox } from "@angular/material";
*/

export interface Params {
  type: string;
  id?: string;
}

@Component({
  selector: "content-editor",
  templateUrl: "./editor.html",
  styleUrls: ["./editor.scss"]
})
export class ContentEditorComponent implements OnInit {
  params: Params;
  formObj: FormObj;
  formObj$: Observable<FormObj>;
  response: Response;

  //uploading vars
  @ViewChild("file") file; //access #file DOM element

  //access <content-editor> properties and methods
  @ViewChild(NgxFormComponent, { static: true })
  private formComp: NgxFormComponent;
  files = []; //Set<File> = new Set();
  progress: Progress;
  categories;
  steps;

  //todo: hide this route from search engines

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private snackBar: MatSnackBar,
    private hljs: HighlightJS,
    private storage: AngularFireStorage
  ) {}

  ngOnInit() {
    //queryParams --concatMap-->combineLatest(getData(), getCategories()) --map--> formObj
    /* updating this.formObj$ & this.params value after waiting getData() to finish
       will caue error: ExpressionChangedAfterItHasBeenCheckedError
       solutions:
         - move this.params={...} to constractor (will need to call getData() in constructor)
         - force change detection call
    */
    this.formObj$ = urlParams(this.route).pipe(
      map(([params, query]) => {
        this.params = { id: params.get("item"), type: params.get("type") };
      }),
      concatMap(() =>
        forkJoin(
          this.getData().pipe(
            map((model: Article) => {
              if (model.cover) {
                let cover = article[article.findIndex(el => el.key == "cover")],
                  src = `/image/${model.type}-cover-${model._id}/${model.slug}.webp`;
                cover.templateOptions.existsFiles = [
                  {
                    name: "cover image",
                    src: `${src}?size=100`,
                    link: src
                  }
                ];
              }
              return model;
            })
          ),
          this.getCategories(this.params.type)
        )
      ),
      map(([model, categories]) => {
        //change content.type from textarea to quill
        let content = article[article.findIndex(el => el.key == "content")];
        content.type = "quill";
        if (!content.templateOptions)
          (content.templateOptions as any) = { label: "content" };
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

        if (this.params.type == "job") {
          /*
            //delete cover image since jobs.layout=="list" not grid
            //dont use delete article.fields(...)
            article.splice(
              article.findIndex(el => el.type == "file"),
              1
            );*/

          //add field:contacts after content
          article.splice(article.findIndex(el => el.key == "content") + 1, 0, {
            key: "contacts",
            type: "textarea",
            templateOptions: {
              label: "contacts",
              required: false,
              rows: 2
            }
          });

          //todo: add fields: required experience, salary,
          // job type (ex: full time), location{}, company{}, required skills,
          //application deadline (date), ..

          //todo: categories = sub of jobs, main category = jobs

          //todo: if(form.content contains contacts)error -> email, mobile, link
        }

        return {
          steps: [
            { title: "", fields: article },
            {
              title: "",
              fields: [
                {
                  key: "categories",
                  type: "categories",
                  templateOptions: {
                    categories
                  }
                }
              ]
            }
          ],
          model
        };
      })
    );
  }

  getData() {
    return this.params.id
      ? this.httpService.get<Article>(this.params)
      : of(<Article>{});
  }

  getCategories(type: string) {
    //todo: getCategories(~categories/:type)
    return this.httpService.get<any>(`${type}_categories`);
  }

  onSubmit(formObj: FormObj) {
    //todo: data.files=this.upload() or: submit().subscribe(data=>upload())
    //todo: data.files= {cover: #cover.files.data}
    //todo: send base64 data from data.content to firebase storage
    //this.formObj = formObj;

    this.response = {
      status: "loading"
    };

    if (!formObj || !formObj.form || !formObj.form.value) {
      this.response = {
        status: "error",
        message: "technichal error, `formObj` is undefined"
      };
      if (env.dev) console.log({ formObj });
      return;
    }

    let data = formObj.form.value;
    data._id = this.params.id;
    if (env.dev) console.log("onSubmit()", data);

    let files = formObj.fields.filter(el => el.type == "file"); //todo: formObj$.form.get('cover').files?
    //todo: app.post("/api/",data)
    this.httpService
      .progress<any>("post", this.params.type, data)
      .subscribe((event: HttpEvent<any>) => {
        if (env.dev) console.log("[upload]", event);
        if (event.type == HttpEventType.UploadProgress)
          this.progress = { loaded: event.loaded, total: event.total };
        //todo: send to formObj$.fields[type=file]
        else if (event.type === HttpEventType.Response) {
          let data = event.body;

          if (!data)
            this.response = {
              status: "error",
              message: "no data"
            };
          else
            this.response = data.error
              ? {
                  status: "error",
                  message: data.error.message || data.error.msg
                }
              : {
                  status: "ok",
                  message: data._id
                    ? `${data.type} posted successfully, <a href="/id/${data._id}">view</a>`
                    : ""
                };

          //todo: reset progress value
          //todo: showSnackBar() content: is html
          this.showSnackBar(
            (this.response.status === "ok" ? "form submitted" : "error") +
              this.response.message || "",
            "close",
            7000
          );
          //this.uploadedFiles=event.body;
          formObj.form.reset();

          //todo: fix: this.formComp.formElement.reset is not a function
          //  this.formComp.formElement.reset(); //https://stackoverflow.com/a/49789012/12577650; also see create.html
          //  this.files.clear();
          this.files = [];
        }
      });
  }

  //update this.formObj value every time the formObj has been changed.
  //note: this value already sent with the event `submit`
  onFormChange(formObj: FormObj) {
    this.formObj = formObj;
  }

  isValid(field: string, form?) {
    if (!form) form = this.formObj.form;
    return !form.get(field).touched || !form.get(field).hasError("required");
  }
  getErrorMessage(field: string, name?: string, form?) {
    //todo: move to packages/ngx-content/editor/editor.ts
    if (!form) form = this.formObj.form;
    let _field = form.get(field);

    if (_field.hasError("required")) {
      if (name) return `${name} is required`;
      else return "You must enter a value";
    }

    return _field.hasError("email") ? "Invalid email" : "";
  }

  showSnackBar(message: string, action: string, duration = 0) {
    this.snackBar.open(message, action, { duration });
  }
}
