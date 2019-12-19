import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { FormBuilder, Validators } from "@angular/forms";
import { Observable, forkJoin } from "rxjs";

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
  progress;
  showUploadBtn = true;
  uploading = false;
  uploadSuccessful = false;
  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private formBuilder: FormBuilder
  ) {}
  ngOnInit() {
    this.form = this.formBuilder.group({
      title: ["", [Validators.required, Validators.maxLength(100)]],
      subtitle: "",
      content: ["", [Validators.required]],
      keywords: ""
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
    this.data = this.httpService.post(
      this.params.type,
      data
    ); /*.subscribe(
      data => {
        this.data = data;
      },
      err =>
        console.error(`Error @content: ${this.params.type}/onSubmit():`, err)
    );*/

    this.upload();
    this.form.reset();
  }

  valid(field: string) {
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
    this.progress = this.httpService.upload(this.params.type, this.files);

    // Adjust the state variables
    this.showUploadBtn = false;

    // When all progress-observables are completed...
    let allProgressObservables = [];
    for (let key in this.progress) {
      allProgressObservables.push(this.progress[key].progress);
    }
    forkJoin(allProgressObservables).subscribe(end => {
      this.uploadSuccessful = true;
      this.uploading = false;
    });
  }
}
