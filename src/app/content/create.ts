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
  templateUrl: "./create.html",
  styleUrls: ["./create.scss"]
})
export class ContentCreateComponent implements OnInit {
  params: Params;
  data: Observable<Object>;
  form;
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
}
