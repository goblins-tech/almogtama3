import {
  Component,
  OnInit,
  ViewChild,
  ViewChildren,
  QueryList,
  Input,
  Output,
  EventEmitter
} from "@angular/core";
import { Formly } from "../ngx-formly/core/formly"; //todo: add to peerDependencies
export { Formly as FormObj };
import { Observable } from "rxjs";
import { keepHtml } from "../ngx-content/core/functions";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

//you need to add css classes: alert, alert-ok, alert-error

//todo:use <ng-container .pre|post> instead of pre.preForm, pre.postForm
export interface Pref {
  title?: string; //ex: Create a new article.
  preForm?: string | SafeHtml; //an html content to render before the form.
  postForm?: string | SafeHtml;
}

export interface Response {
  ok: boolean;
  msg?: string;
}

@Component({
  selector: "ngx-form",
  templateUrl: "./form.html"
})
export class NgxFormComponent implements OnInit {
  @Input() formObj: Formly;
  @Input() pref: Pref;
  @Input() response: Response;
  @Input() submitting: boolean;
  @Input() progress; //todo: show progress bar
  @Output() submit = new EventEmitter<Formly>();

  //give the parent component access to #formElement, whitch is a child of this component
  @ViewChild("formElement") formElement; //todo: formElement:ElementRef<HTMLElement>

  /*
  in parent component, subscribe to `formChange` event to update `this.formObj`
  even if the form has not been submitted.
  the `submit` event provide the recent updated version of `formObj`, so you can
  use it to update this.formObj value each time the form has been submitted.
   */
  @Output() formChange = new EventEmitter<Formly>();

  constructor(private sanitizer: DomSanitizer) {}

  //todo: output: onSubmit
  //todo: onSubmit -> update response
  //todo: to auto fill the form use $formObj.model
  ngOnInit() {
    if (this.pref) {
      //todo: use keepHtml pipe
      this.pref.preForm = keepHtml(this.pref.preForm, this.sanitizer);
      this.pref.postForm = keepHtml(this.pref.postForm, this.sanitizer);
    }
  }

  onSubmit(formObj: Formly) {
    //emit the EventEmitter `submit`, and send `formObj`
    this.submit.emit(formObj);
  }

  onFormChange(formObj: Formly) {
    //todo: subscribe to `formly` change event.
    this.formChange.emit(formObj);
  }
}
