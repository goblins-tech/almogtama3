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
import { Observable } from "rxjs";
import { keepHtml } from "../ngx-content/core/functions";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { FormGroup, FormArray } from "@angular/forms";
import {
  FormlyFieldConfig,
  FormlyFormOptions,
  FieldArrayType
} from "@ngx-formly/core";

//you need to add css classes: alert, alert-ok, alert-error for `reponse` div

export interface FormObj {
  form?: FormGroup | FormArray;
  fields?: FormlyFieldConfig[];
  steps?: Step[];
  model?: { [key: string]: any }; //data from API calls
  options?: FormlyFormOptions;
  title?: string;
}

export interface Step {
  title?: string;
  fields?: FormlyFieldConfig[];
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
  @Input() formObj: FormObj;
  @Input() response: Response;
  @Input() submitting: boolean;
  @Input() progress; //todo: show progress bar
  @Input() step: number;
  @Output() submit = new EventEmitter<FormObj>();

  //give the parent component access to #formElement, whitch is a child of this component
  @ViewChild("formElement") formElement; //todo: formElement:ElementRef<HTMLElement>

  /*
  in parent component, subscribe to `formChange` event to update `this.formObj`
  even if the form has not been submitted.
  the `submit` event provide the recent updated version of `formObj`, so you can
  use it to update this.formObj value each time the form has been submitted.
   */
  @Output() formChange = new EventEmitter<FormObj>();

  constructor(private sanitizer: DomSanitizer) {}

  //todo: output: onSubmit
  //todo: onSubmit -> update response
  //todo: to auto fill the form use $formObj.model
  ngOnInit() {
    if (this.formObj) {
      this.formObj.form = this.formObj.form || new FormGroup({});
      if (this.formObj.steps) {
        this.step = this.step || 0;
        this.go();
      }
    }
  }

  go(n = 0) {
    this.step += n;
    let step = this.formObj.steps[this.step];

    if (step) {
      //https://stackoverflow.com/a/46070221/12577650
      this.formObj = Object.assign(this.formObj, {
        fields: step.fields,
        title: step.title,
        model: this.formObj.form.value //save the current value,so the feilds values preserved when the user come back to this step.
      });
    }
  }

  onSubmit(formObj: FormObj) {
    //emit the EventEmitter `submit`, and send `formObj`
    this.submit.emit(formObj);
  }

  onFormChange(formObj: FormObj) {
    //todo: subscribe to `formly` change event.
    this.formChange.emit(formObj);
  }
}
