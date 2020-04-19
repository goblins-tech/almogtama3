import { NgModule } from "@angular/core";
import { FormlyFieldFile, FileValueAccessor } from "./component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FormlyModule } from "@ngx-formly/core";
import { CommonModule } from "@angular/common";

import {
  MatProgressBarModule,
  MatButtonModule,
  MatListModule,
  MatIconModule
  //MatGridListModule,
} from "@angular/material";

@NgModule({
  declarations: [FormlyFieldFile, FileValueAccessor],
  imports: [
    CommonModule, //to use `ngForOf`
    FormsModule,
    ReactiveFormsModule, //to use formControl: <input [formControl]="">
    FormlyModule, //to use `formlyAttributes`
    MatProgressBarModule,
    MatButtonModule,
    MatListModule,
    MatIconModule
  ]
})
export class FormlyFileModule {}
