import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { FormBuilder, Validators } from "@angular/forms";
import { Observable, forkJoin } from "rxjs";
import { HttpEventType } from "@angular/common/http";
import { MatSnackBar } from "@angular/material";
import { Data } from "./index"; //todo: use tripple directive i.e: ///<reference types="./index.ts" />
import { article } from "./formly";

export interface Params {
  type: string;
  id?: string;
}

@Component({
  selector: "app-content",
  templateUrl: "./create.html",
  styleUrls: ["./create.scss"]
})
export class ContentCreateComponent implements OnInit {
  params: Params;
  data$: Observable<Object>;
  form;

  //uploading vars
  @ViewChild("file", { static: false }) file; //access #file DOM element
  @ViewChild("formElement", { static: false }) formElement;
  public files: Set<File> = new Set();
  uploadedFiles;
  showUploadBtn = true;
  uploading = false;
  uploadSuccessful = false;
  progress;
  msg = "";
  articleForm;
  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private formBuilder: FormBuilder, //formly uses FormGroup and FormArray intead of FormBuilder
    private snackBar: MatSnackBar
  ) {}
  ngOnInit() {
    this.form = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(100)]],
      subtitle: "",
      slug: "", //todo: default = title
      content: ["", [Validators.required]],
      keywords: "",
      cover: null
    });

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
    //todo: data.files=this.upload()

    console.log("content.ts onSubmit()", data);
    this.httpService
      .post(this.params.type, data, {
        formData: true,
        reportProgress: true,
        observe: "events"
      })
      .subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = Math.round((event.loaded * 100) / event.total);
        } else if (event.type === HttpEventType.Response) {
          console.log(event.body);
          if (event.body!.ok) this.msg = "ok";
          else this.msg = event.body!.msg;
          this.showSnackBar(
            this.msg == "ok" ? "form submitted" : this.msg,
            "close",
            3000
          );
          //this.uploadedFiles=event.body;
          this.form.reset();
          this.formElement.reset(); //https://stackoverflow.com/a/49789012/12577650; also see create.html
          this.files.clear();
        }
      });
    /*.subscribe(
      data => {
        this.data = data;
      },
      err =>
        console.error(`Error @content: ${this.params.type}/onSubmit():`, err)
    );*/

    //  this.upload();
  }

  isValid(field: string) {
    return (
      !this.form.get(field).touched ||
      !this.form.get(field).hasError("required")
    );
  }
  getErrorMessage(_field: string, name?: string) {
    let field = this.form.get(_field);

    if (field.hasError("required")) {
      if (name) return `${name} is required`;
      else return "You must enter a value";
    }

    return field.hasError("email") ? "Invalid email" : "";
  }

  showSnackBar(message: string, action: string, duration = 0) {
    this.snackBar.open(message, action, { duration });
  }

  //clicks on <input #file>
  addFiles() {
    this.file.nativeElement.click();
  }

  onFilesAdded() {
    let files: { [key: string]: File } = this.file.nativeElement.files;
    for (let key in files) {
      if (!isNaN(parseInt(key))) {
        this.files.add(files[key]);
      }
    }
    this.showUploadBtn = true;
  }

  upload() {
    //todo: return files[] to merge it with other form fields

    // start the upload and save the progress map
    this.uploading = true;
    this.uploadedFiles = this.httpService.upload(
      this.params.type,
      this.files,
      "cover"
    );

    // Adjust the state variables
    this.showUploadBtn = false;

    // When all progress-observables are completed...
    forkJoin(this.uploadedFiles.progress).subscribe(end => {
      this.uploadSuccessful = true;
      this.uploading = false;
    });
  }
}
