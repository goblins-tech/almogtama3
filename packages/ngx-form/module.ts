import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FormlyModule } from "@ngx-formly/core";
import { NgxFormComponent } from "./form";
import { MatButtonModule } from "../ngx-content/view/material"; //todo: add ngx-content-view & material to peerDependencies
import { NgxContentCoreModule } from "../ngx-content/core";
/*
 - we added NgxFormComponent to @NgModule.exports[]
   to be used in other modules (parent component),
   whether in thml template or via @ViewChild()
 */
@NgModule({
  declarations: [NgxFormComponent],
  imports: [
    NgxContentCoreModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormlyModule
  ],
  exports: [NgxFormComponent]
})
export class NgxFormModule {}
