import {
  Component,
  OnInit,
  ViewChild,
  ViewContainerRef,
  Input
} from "@angular/core";
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
import { DynamicLoadService } from "../../../eldeeb/ng/dynamic-load.service";

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
  data$: Observable<Object>;

  //uploading vars
  @ViewChild("file", { static: false }) file; //access #file DOM element
  @ViewChild("formElement", { static: false }) formElement;
  files = []; //Set<File> = new Set();
  progress;
  response;
  submitting = false;
  articleForm;
  categories;

  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private snackBar: MatSnackBar,
    private hljs: HighlightJS,
    private storage: AngularFireStorage,
    private sanitizer: DomSanitizer,
    private dynamic: DynamicLoadService
  ) {}
  ngOnInit() {
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
        /*
        //delete cover image since jobs.layout=="list" not grid
        //dont use delete article.fields(...)
        article.fields.splice(
          article.fields.findIndex(el => el.type == "file"),
          1
        );*/

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
      }

      article.fields.push({
        key: "categories",
        type: "categories",
        templateOptions: { categories: this.getCategories("articles") }
      });

      this.articleForm = article;
      console.log({ articleForm: article });

      /*this.getCategories("articles").subscribe(ctg => {
        console.log({ ctg });

        if (typeof ctg.data == "string") ctg.data = JSON.parse(ctg.data); //todo: why response: string
        console.log({ ctg });
        this.articleForm.form.get("title").setValue("test");
        //or: this.articleForm.fields.find(el => el.key == "title").formControl.setValue("test2");

      });*/
    });
  }

  getData() {
    return this.httpService.get<Data>({
      id: this.params.id
    });
  }

  getCategories(type: string) {
    return this.httpService.get<any>("~categories"); //todo: ~categories/:type
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
  selector: "formly-field-categories",
  template: `
    <ng-template #ref> </ng-template>
  `
})
export class FormlyFieldCategories extends FieldType implements OnInit {
  categories;
  @ViewChild("ref", { read: ViewContainerRef, static: true })
  ref: ViewContainerRef;

  constructor(private dynamic: DynamicLoadService) {
    super();
  }

  ngOnInit() {
    //  this.createComponent();
    let data = this.to.categories;
    //todo: load <mat-checkbox> inputs directly without a helper class
    this.dynamic.load(FormlyFieldCategoriesHelper, this.ref, {
      data,
      to: this.to,
      formControl: this.formControl,
      fielf: this.field
    });
  }
}

@Component({
  selector: "formly-field-categories-helper",
  template: `
    <div [innerHTML]="categories"></div>
  `
})
/*
notes:
 - didn't work:
     <ng-template *ngFor="let ctg of dataObj"
       ><mat-checkbox>{{ ctg.title }}</mat-checkbox>
     </ng-template>

todo:
 - add checked inputs to form value

 */
export class FormlyFieldCategoriesHelper implements OnInit {
  @Input() data: any;
  @Input() to: any;
  @Input() formControl: any; //https://github.com/aitboudad/ngx-formly/blob/28bf56ab63ad158a7418ea6d7f2377165252a3e3/src/material/checkbox/src/checkbox.type.ts
  @Input() field: any;
  dataObj;
  categories;
  constructor(private sanitizer: DomSanitizer) {}
  ngOnInit() {
    console.log({ formControl: this.formControl, field: this.field });
    this.data.subscribe(data => {
      console.log("FormlyFieldCategoriesHelper", data);
      if (typeof data == "string") data = JSON.parse(data);
      if (data.ok && data.data && data.data.categories) {
        this.dataObj = data.data.categories;
        let ctg = new Categories(data.data.categories);
        let inputs =
          ctg.createInputs(null, el => el._id != "5ac348980d63be4aa0e967cb") +
          `<mat-checkbox [formControl]="formControl" [formlyAttributes]="field">test3</mat-checkbox>`;
        this.categories = this.sanitizer.bypassSecurityTrustHtml(inputs);
        //todo: using "| keepHtml" makes all checkboxes disabled
      }
      //todo: else
    });
  }
}
