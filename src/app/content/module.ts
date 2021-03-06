import { LOCALE_ID, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Routes, RouterModule, UrlSegment } from "@angular/router";
import { ContentComponent } from "./view";
import { ContentEditorComponent } from "./editor";
import { ContentManageComponent } from "./manage";

//todo: add 'packages' to tsConfig
import { NgxContentViewModule } from "pkg/ngx-content/view";
import { NgxFormModule } from "pkg/ngx-form";

import { ShareButtonsModule } from "@ngx-share/buttons";
import {
  FontAwesomeModule,
  FaIconLibrary
} from "@fortawesome/angular-fontawesome";
import { QuillModule } from "ngx-quill";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FormlyModule } from "@ngx-formly/core";
import {
  FormlyFileModule,
  FormlyFieldFile
} from "pkg/ngx-formly/file-material";
import { FormlyMaterialModule } from "@ngx-formly/material";
import { FormlyFieldQuill } from "pkg/ngx-formly/quill/component";
import {
  FormlyCategoriesModule,
  FormlyFieldCategories,
  FormlyFieldCategoriesHelper
} from "pkg/ngx-formly/categories-material";
import { HighlightModule } from "ngx-highlightjs";

/*
todo: enable  ngx-formly-material-file
import {
  FileTypeComponent,
  FileTypeModule,
  FileTypeValidationMessages
} from "ngx-formly-material-file"; */

//material design
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatCheckboxModule, MatCheckbox } from "@angular/material/checkbox";
import { MatOptionModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatGridListModule } from "@angular/material/grid-list";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatSelectModule } from "@angular/material/select";
import { MatSnackBarModule } from "@angular/material/snack-bar";

import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { LazyLoadImageModule } from "ng-lazyload-image";
import { DynamicLoadService } from "pkg/ngx-tools/dynamic-load.service";

const routes: Routes = [
  //ex: /articles/category-slug/item-slug=123
  { path: ":type", component: ContentComponent },
  { path: ":type/editor", component: ContentEditorComponent }, // ex: /editor?type=jobs
  { path: ":type/editor/:item", component: ContentEditorComponent },
  { path: ":type/manage", component: ContentManageComponent }, //same as index page but lists only user's posts with notes and status
  { path: ":type/item/:item", component: ContentComponent },
  { path: ":type/:category/:item", component: ContentComponent },
  { path: ":type/:category", component: ContentComponent },
  { path: "", component: ContentComponent, pathMatch: "full" } //or: redirectTo: "articles",
];

export const APP_LOCALE_ID = "en-US";
//export const fileTypeModule = FileTypeModule.forRoot();

@NgModule({
  declarations: [
    ContentComponent,
    ContentManageComponent,
    FormlyFieldQuill,
    ContentEditorComponent
  ],
  exports: [RouterModule],
  imports: [
    NgxContentViewModule,
    NgxFormModule,
    FormlyFileModule,
    FormlyCategoriesModule,
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    //fileTypeModule, //todo: error: unction calls are not supported in decorators but 'FileTypeModule' was called https://github.com/ng-packagr/ng-packagr/issues/1127#issuecomment-437351093 , https://github.com/alEX860111/ngx-formly-material-file/issues/1
    FormlyModule.forRoot({
      types: [
        { name: "file", component: FormlyFieldFile, wrappers: ["form-field"] }, //todo: add to component instead of module
        {
          name: "quill",
          component: FormlyFieldQuill,
          wrappers: ["form-field"]
        },
        {
          name: "categories",
          component: FormlyFieldCategories,
          wrappers: ["form-field"]
        }
        //  { name: "file", component: FileTypeComponent }, //from ngx-formly-material-file,
      ]
      //validationMessages: new FileTypeValidationMessages(APP_LOCALE_ID).validationMessages
    }),
    FormlyMaterialModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatCardModule,
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatCheckboxModule,
    ShareButtonsModule,
    FontAwesomeModule,
    QuillModule.forRoot(),
    HighlightModule, //todo: import common languages only https://ngx-highlight.netlify.com/
    LazyLoadImageModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: APP_LOCALE_ID },
    DynamicLoadService
  ],
  bootstrap: [],
  entryComponents: [FormlyFieldCategoriesHelper] //https://stackoverflow.com/a/60267178/12577650
})
export class ContentModule {
  constructor(faIconLibrary: FaIconLibrary) {
    faIconLibrary.addIconPacks(fab, fas);
  }
}
