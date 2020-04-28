import { Component, OnInit, ViewChild, Input } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Data } from "../../../packages/ngx-content/view"; //todo: use tripple directive i.e: ///<reference types="./index.ts" />
import { HighlightJS } from "ngx-highlightjs";
import { keepHtml, Categories } from "./functions";
import { urlParams } from "../../../packages/ngx-tools/routes";
import { environment as env } from "../../environments/environment";
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
  NgxFormComponent,
  article
} from "../../../packages/ngx-form";

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
  formObj: FormObj;
  formObj$: Observable<FormObj>;
  response: Response;

  //uploading vars
  @ViewChild("file") file; //access #file DOM element

  //access <content-editor> properties and methods
  @ViewChild(NgxFormComponent, { static: true })
  private formComp: NgxFormComponent;
  files = []; //Set<File> = new Set();
  progress;
  submitting = false;
  categories;
  steps;

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private snackBar: MatSnackBar,
    private hljs: HighlightJS,
    private storage: AngularFireStorage
  ) {}
  ngOnInit() {
    this.formObj$ = urlParams(this.route).pipe(
      map(([params, query]) => {
        //todo: if($_GET[id])getData(type,id)
        //ex: /editor?type=jobs or /editor:id
        this.params = {
          id: params.get("id") || "",
          type: query.get("type")
        };

        //set the default type
        if (!this.params.id && !this.params.type) this.params.type = "articles";

        /*
      todo: if(id){
              - getData()
              - get this.params.type from getData().type
            }
       */

        //todo: this.formObj.model = this.getData()
        //todo: load categories
        /*
        this.getCategories("articles").subscribe(data => {
          console.log({ categories: data });
          if (data.ok && data.data && data.data.categories) {
            let ctg = new Categories(data.data.categories);
            console.log({ ctg: data.data.categories });
            this.categories = ctg.createInputs(
              null,
              el => el._id != "5ac348980d63be4aa0e967cb"
            );
          }
          //todo: else
        });
         */

        //create formObj:

        //change content.type from textarea to quill
        let content = article[article.findIndex(el => el.key == "content")];
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

        if (dev)
          console.log({
            params,
            query,
            calculatedParamas: this.params
          });

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
                    categories: this.getCategories("articles").pipe(
                      map(result =>
                        result.ok && result.data ? result.data.categories : {}
                      )
                    )
                  }
                }
              ]
            }
          ]
        };

        /*this.getCategories("articles").subscribe(ctg => {
              console.log({ ctg });

              if (typeof ctg.data == "string") ctg.data = JSON.parse(ctg.data); //todo: why response: string
              console.log({ ctg });
              this.formObj$.form.get("title").setValue("test");
              //or: this.formObj$.fields.find(el => el.key == "title").formControl.setValue("test2");

            });*/
      })
    );
  }

  getData() {
    return this.httpService.get<Data>({
      id: this.params.id
    });
  }

  getCategories(type: string) {
    return this.httpService.get<any>("~categories"); //todo: ~categories/:type
  }

  onSubmit(formObj: FormObj) {
    //todo: data.files=this.upload() or: submit().subscribe(data=>upload())
    //todo: data.files= {cover: #cover.files.data}
    //todo: send base64 data from data.content to firebase storage
    //this.formObj = formObj;

    if (!formObj || !formObj.form || !formObj.form.value) {
      this.response = {
        ok: false,
        msg: "technichal error, `formObj` is undefined"
      };
      console.log({ formObj });
      return;
    }

    let data = formObj.form.value;
    console.log("onSubmit()", data);
    this.submitting = true;
    this.response = null;

    let files = formObj.fields.filter(el => el.type == "file"); //todo: formObj$.form.get('cover').files?
    //todo: app.post("/api/",data)
    this.httpService.upload(this.params.type, data, (type, event, value) => {
      if (type == "progress") this.progress = value;
      //todo: send to formObj$.fields[type=file]
      else if (type == "response") {
        console.log("event.body", event.body);
        let data = event.body.data;
        this.response = {
          ok: event.body.ok,
          msg: data
            ? `<a href="/id/${data.shortId || data._id || data.id}">view</a>`
            : ""
        };

        this.submitting = false;
        //todo: reset progress value
        this.showSnackBar(
          (event.body.ok ? "form submitted" : "Error ") + this.response.msg ||
            "",
          "close",
          3000
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
