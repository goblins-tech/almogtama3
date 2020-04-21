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
import { Formly } from "../../ngx-formly/core/formly"; //todo: add to peerDependencies
export { Formly as FormObj };
import { Observable } from "rxjs";
import { keepHtml } from "../view/functions";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

//you need to add css classes: alert, alert-ok, alert-error

//todo:use <ng-container .pre|post> instead of pre.preForm, pre.postForm
export interface Pref {
  title?: string; //ex: Create a new article.
  preForm?: string | SafeHtml; //an html content to render before the form.
  postForm?: string | SafeHtml;
}

//todo: get Data interface from
export interface Data {
  title?: string;
}

export interface Response {
  ok: boolean;
  msg?: string;
}

@Component({
  selector: "content-editor",
  templateUrl: "./editor.html"
})
export class NgxContentEditorComponent implements OnInit {
  @Input() formObj: Formly | Observable<Formly>;
  $formObj: Formly;
  @Input() pref: Pref | Observable<Pref>;
  $pref: Pref;
  @Input() response: Response;
  @Input() submitting: boolean;
  @Input() progress; //todo: show progress bar
  @Output() submit = new EventEmitter<Formly>();

  //give the parent component access to #formElement, whitch is a child of this component
  @ViewChild("formElement", { static: false }) formElement; //todo: formElement:ElementRef<HTMLElement>

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
    if (this.formObj instanceof Observable)
      this.formObj.subscribe(data => {
        this.$formObj = data;
      });
    else this.$formObj = this.formObj;

    if (this.pref instanceof Observable)
      this.pref.subscribe(data => {
        this.$pref = data;
        if (this.$pref) {
          this.$pref.preForm = keepHtml(this.$pref.preForm, this.sanitizer);
          this.$pref.postForm = keepHtml(this.$pref.postForm, this.sanitizer);
        }
      });
    else {
      this.$pref = this.pref;
      if (this.$pref) {
        this.$pref.preForm = keepHtml(this.$pref.preForm, this.sanitizer);
        this.$pref.postForm = keepHtml(this.$pref.postForm, this.sanitizer);
      }
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
