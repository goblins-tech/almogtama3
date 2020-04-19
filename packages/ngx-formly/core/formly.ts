import { FormGroup, FormArray } from "@angular/forms";
import {
  FormlyFieldConfig,
  FormlyFormOptions,
  FieldArrayType
} from "@ngx-formly/core";

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

you need to add custom-component to some types such as `file`, `content`

 */

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
