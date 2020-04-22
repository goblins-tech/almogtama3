import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FormlyModule } from "@ngx-formly/core";
import { NgxContentEditorComponent } from "./editor";
import { MatButtonModule } from "../view/material"; //todo: add ngx-content-view & material to peerDependencies
import { NgxContentCoreModule } from "../core";
/*
 we added NgxContentEditorComponent to @NgModule.exports[] because it's used by the parent component via @ViewChild()
 */
@NgModule({
  declarations: [NgxContentEditorComponent],
  imports: [
    NgxContentCoreModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FormlyModule
  ],
  exports: [NgxContentEditorComponent]
})
export class NgxContentEditorModule {}
