/*
- this module and it's components don't perform any HTTP request, it just receives the data and show it.

- notes:
    - @angular/material: add material css to angular.json styles[]
    - @ngx-share/buttons: add `HttpClientModule` to `@ngModule.imports`
    - we use `ngx-quill`  for <quill-view>
    - install peerDependencies

*/

import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgxContentViewComponent } from "./view";
import { NgxContentCoreModule } from "../core"; //to use pipes
import {
  MatCardModule,
  MatGridListModule,
  MatButtonModule,
  MatIconModule,
  MatListModule,
  MatProgressBarModule,
  MatSnackBarModule
} from "./material";

import { LazyLoadImageModule } from "ng-lazyload-image";
import { HighlightModule } from "ngx-highlightjs";
import { QuillModule } from "ngx-quill";
import { ShareButtonsModule } from "@ngx-share/buttons";
import {
  FontAwesomeModule,
  FaIconLibrary
} from "@fortawesome/angular-fontawesome";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";

@NgModule({
  declarations: [NgxContentViewComponent],
  exports: [NgxContentViewComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatSnackBarModule,
    LazyLoadImageModule,
    HighlightModule,
    QuillModule.forRoot(),
    ShareButtonsModule,
    FontAwesomeModule,
    HttpClientModule,
    NgxContentCoreModule
  ],
  providers: [],
  bootstrap: [],
  entryComponents: []
})
export class NgxContentViewModule {
  constructor(faIconLibrary: FaIconLibrary) {
    faIconLibrary.addIconPacks(fab, fas);
  }
}
