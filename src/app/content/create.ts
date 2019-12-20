import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { FormBuilder, Validators } from "@angular/forms";
import { Observable, forkJoin } from "rxjs";
import { HttpEventType } from "@angular/common/http";

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
  data: Observable<Object>;
  form;

  //uploading vars
  @ViewChild("file", { static: false }) file; //access #file DOM element
  public files: Set<File> = new Set();
  uploadedFiles;
  showUploadBtn = true;
  uploading = false;
  uploadSuccessful = false;
  progress;
  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private formBuilder: FormBuilder
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

    this.getData();
  }

  getData() {
    this.route.paramMap.subscribe(params => {
      this.params = { type: params.get("type"), id: params.get("id") };
      this.data = this.httpService.get(this.params.type, this.params.id);
    });
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
          //this.uploadedFiles=event.body;
          this.form.reset();
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
