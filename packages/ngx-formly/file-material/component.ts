//formly doesn't support 'file' type, so we create a custom one.
//todo: pass attributes, such as style="display:none;" to replace it with a button
//add it to module:   FormlyModule.forRoot({types: [{ name: 'file', component: FormlyFieldFile, wrappers:['form-field'] }, ]}),
//todo: pass label:  {type:"file",label:"we don't want this value, pass it to out child component as an attribute", templateOptions:{attributes:{label:"cover image"}}}
//todo: emit events: progress, response, change (fileAdded)
//todo: move custom types (such as quill) out of formly

import { Component, Directive, ViewChild, Input, OnInit } from "@angular/core";
import { FieldType } from "@ngx-formly/material";
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from "@angular/forms";

@Component({
  selector: "formly-field-file",
  templateUrl: "./component.html"
})
export class FormlyFieldFile extends FieldType implements OnInit {
  @ViewChild("fileInput", { static: false }) fileInput;
  @Input() progress: number = 0; //todo: progress:Observable & subscribe to it
  files: Set<File> = new Set();
  name = "";
  multiple = false;
  accept = ""; //file type : ex: images/*
  capture = ""; //source ex: accept="user" -> device webcam & mic

  //todo: implement , AfterViewInit?
  ngAfterViewInit() {
    console.log({
      formControl: this.to.formControl,
      formControl2: this.to.formControl2,
      formControl3: this.formControl //todo: this.formControl.fields contains only this input, not all form inputs,we need to pass articleForm.form to this.formControl
    });
    console.log({
      templateOptions: this.to, //contains any data that passed to Field.templateOptions{}, same as using nativeElement
      label: this.to.label, //in template: {{to.label}}
      label2: this.fileInput.nativeElement.getAttribute("data-test") //Field.templateOptions.attributes are passed to <input file> itself, not to the component
    }); //any data passed to Field.templateOptions{}
  }

  addFiles() {
    //clicks on <input #file>
    this.fileInput.nativeElement.click();
  }

  onFilesAdded() {
    let files: { [key: string]: File } = this.fileInput.nativeElement.files;
    for (let key in files) {
      if (!isNaN(parseInt(key))) {
        this.files.add(files[key]);
      }
    }
  }

  remove(file) {
    this.files.delete(file);
  }

  clear() {
    this.files.clear();
  }
}

//ControlValueAccessor for 'file' input
//https://formly.dev/examples/other/input-file
//https://github.com/angular/angular/issues/7341
@Directive({
  selector: "input[type=file]",
  host: {
    "(change)": "onChange($event.target.files)",
    "(blur)": "onTouched()"
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: FileValueAccessor, multi: true }
  ]
})
export class FileValueAccessor implements ControlValueAccessor {
  value: any;
  onChange = _ => {};
  onTouched = () => {};

  writeValue(value) {}
  registerOnChange(fn: any) {
    this.onChange = fn;
  }
  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }
}
