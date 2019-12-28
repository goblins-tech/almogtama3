import { Component, ViewChild, Input } from "@angular/core";
import { FormGroup, FormArray } from "@angular/forms";
import { FormlyFieldConfig, FormlyFormOptions } from "@ngx-formly/core";
import { FieldType } from "@ngx-formly/material";

//formly doesn't support 'file' type, so we create a custom one.
//todo: pass attributes, such as style="display:none;" to replace it with a button
//add it to module:   FormlyModule.forRoot({types: [{ name: 'file', component: FormlyFieldFile, wrappers:['form-field'] }, ]}),
//todo: pass label:  {type:"file",label:"we don't want this value, pass it to out child component as an attribute", templateOptions:{attributes:{label:"cover image"}}}
//todo: emit events: progress, response, change (fileAdded)
@Component({
  selector: "formly-field-file",
  template: `
    <h4 *ngIf="label">{{ label }}</h4>
    <input
      type="file"
      #file
      style="display: none"
      (change)="onFilesAdded()"
      multiple
      [formControl]="formControl"
      [formlyAttributes]="field"
    />
    <button
      type="button"
      mat-raised-button
      color="primary"
      (click)="addFiles()"
    >
      Add Files</button
    ><br />

    <!-- show files with progress -->
    <mat-list>
      <mat-list-item *ngFor="let file of files">
        <h4 mat-line>{{ file.name }}</h4>
      </mat-list-item>
      <mat-progress-bar
        mode="determinate"
        [value]="progress"
      ></mat-progress-bar>
    </mat-list>
  `
})
export class FormlyFieldFile extends FieldType {
  @ViewChild("file", { static: false }) file;
  @Input() label: string = "upload";
  @Input() progress: number = 0;
  files: Set<File> = new Set();

  addFiles() {
    //clicks on <input #file>
    this.file.nativeElement.click();
  }

  onFilesAdded() {
    let files: { [key: string]: File } = this.file.nativeElement.files;
    for (let key in files) {
      if (!isNaN(parseInt(key))) {
        this.files.add(files[key]);
      }
    }
  }
}

//create some basic forms
export interface Formly {
  form: FormGroup | FormArray;
  fields: FormlyFieldConfig[];
  model: { [key: string]: any }; //data from API calls
  options?: FormlyFormOptions;
}

export let basic = {
  form: new FormGroup({}),
  fields: [],
  model: {},
  options: {}
};

export let article = {
  ...basic, //todo: is this method cause that the same form controls (i.e basic.form) to be used with every form?
  fields: [
    {
      key: "title", //todo:add validators: <100 chars, no special chars,...
      type: "input",
      templateOptions: {
        label: "Title",
        description: "maximum: 100 charachters",
        required: true,
        maxLength: 100
      }
    },
    {
      key: "subtitle",
      type: "input",
      templateOptions: {
        label: "Subtitle",
        maxLength: 100
      }
    },
    {
      key: "content", //todo: autosize, rows=5
      type: "textarea",
      templateOptions: {
        label: "Content",
        required: true,
        rows: 10
      }
    },
    {
      key: "keywords",
      type: "input",
      templateOptions: {
        label: "keywords"
      }
    },
    {
      key: "cover",
      type: "file", //or: component:FormlyFieldFile, wasn't tested
      templateOptions: {
        label: "Cover image", //todo: move this to attributes.label
        //  change: "onFilesAdded()", //todo: error??
        attributes: { label: "cover image label" }
      }
    }

    //todo:cover image
  ]
};
export let register = { ...basic, fields: [] };

/*
to add static text:
{ noFormControl: true, template: "<p>Some text here</p>" } or
{ noFormControl: true, templateUrl: 'path/to/template.html' }
 */
