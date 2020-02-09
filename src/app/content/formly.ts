import { Component, Directive, ViewChild, Input, OnInit } from "@angular/core";
import {
  FormGroup,
  FormArray,
  NG_VALUE_ACCESSOR,
  ControlValueAccessor
} from "@angular/forms";
import {
  FormlyFieldConfig,
  FormlyFormOptions,
  FieldArrayType
} from "@ngx-formly/core";
import { FieldType } from "@ngx-formly/material";
/*
the following properties are available from node_modules/@ngx-formly/core/lib/templates/fileType.d.ts
-> can be used inside the template: ex: {{field | json}}
->go to {FieldType} to see all properties from parent classes.

 - field: F;  -> {key, type, id, templateOptions, hooks, ...}
 - defaultOptions?: F;
 - model: any;
 - form: FormGroup;
 - options: F['options'];
 - readonly key: string;
 - readonly formControl: import("@angular/forms").AbstractControl;
 - readonly to ... ; //same as field.templateOptions{}
 - readonly showError: boolean;
 - readonly id: string; //same as field.id
 - readonly formState: any;

 in addition to properties from node_modules/@ngx-formly/lib/components/formly.field.config.d.ts
 */

//formly doesn't support 'file' type, so we create a custom one.
//todo: pass attributes, such as style="display:none;" to replace it with a button
//add it to module:   FormlyModule.forRoot({types: [{ name: 'file', component: FormlyFieldFile, wrappers:['form-field'] }, ]}),
//todo: pass label:  {type:"file",label:"we don't want this value, pass it to out child component as an attribute", templateOptions:{attributes:{label:"cover image"}}}
//todo: emit events: progress, response, change (fileAdded)
//todo: move custom types (such as quill) out of formly

@Component({
  selector: "formly-field-file",
  template: `
    <input
      type="file"
      #fileInput
      style="display: none"
      (change)="onFilesAdded()"
      [formControl]="formControl"
      [formlyAttributes]="field"
      [name]="to.name"
      [multiple]="to.multiple"
      [accept]="to.accept"
      [attr.capture]="to.capture"
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
  name = "";
  multiple = false;
  accept = ""; //file type : ex: images/*
  capture = ""; //source ex: accept="user" -> device webcam & mic

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

export let basic: Formly = {
  form: new FormGroup({}),
  fields: [],
  model: {},
  options: {}
};

export let article: Formly = {
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
        label: "Cover image", //todo: move this to attributes.label
        multiple: false,
        accept: "image/*"

        //  change: "onFilesAdded()", //todo: error??
        //to add a header: attributes: {data-header:'say something'}
      }
    }
  ]
};
export let register: Formly = { ...basic, fields: [] };

/*
to add static text:
{ noFormControl: true, template: "<p>Some text here</p>" } or
{ noFormControl: true, templateUrl: 'path/to/template.html' }
 */
