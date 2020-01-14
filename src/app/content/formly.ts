import { Component, ViewChild, Input, OnInit } from "@angular/core";
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
    <!--h4 *ngIf="label">{{ header }}</h4-->
    <input
      type="file"
      #fileInput
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
    <mat-progress-bar mode="determinate" [value]="progress"></mat-progress-bar>

    <mat-list>
      <mat-list-item *ngFor="let file of files">
        <p mat-line>
          {{ file.name }}
          <span
            (click)="remove(file)"
            style="cursor:pointer"
            title="remove this file"
          >
            <mat-icon>delete_forever</mat-icon>
          </span>
        </p>
      </mat-list-item>
    </mat-list>
  `
})
export class FormlyFieldFile extends FieldType implements OnInit {
  @ViewChild("fileInput", { static: false }) fileInput;
  @Input() progress: number = 0; //todo: progress:Observable & subscribe to it
  files: Set<File> = new Set();

  ngAfterViewInit() {
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
}

//todo: move quill as a formly dependencies, and replace Fields.content.type from textarea to quill
@Component({
  selector: "formly-field-quill",
  template: `
    <quill-editor
      [formControl]="formControl"
      [formlyAttributes]="field"
      [modules]="to.modules"
    ></quill-editor>
  `
})
export class FormlyFieldQuill extends FieldType {
  //@Input() modules = {};
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
        description: "maximum: 200 charachters",
        required: true,
        maxLength: 200
      },
      validation: {
        messages: {
          maxLength: "title is too long"
        }
      }
    },
    {
      key: "subtitle",
      type: "input",
      templateOptions: {
        label: "Subtitle",
        maxLength: 200
      }
    },
    {
      key: "slug",
      type: "input",
      templateOptions: {
        label: "slug",
        maxLength: 50,
        description: "maximum: 50 charachters"
      }
    },
    {
      key: "content", //todo: auto resize,
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
        label: "Cover image" //todo: move this to attributes.label
        //  change: "onFilesAdded()", //todo: error??
        //to add a header: attributes: {data-header:'say something'}
      }
    }
  ]
};
export let register = { ...basic, fields: [] };

/*
to add static text:
{ noFormControl: true, template: "<p>Some text here</p>" } or
{ noFormControl: true, templateUrl: 'path/to/template.html' }
 */
