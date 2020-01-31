import { LOCALE_ID, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Routes, RouterModule, UrlSegment } from "@angular/router";
import { ContentComponent } from "./index";
import { ContentEditorComponent } from "./editor";
import { ContentManageComponent } from "./manage";
import { ShareButtonsModule } from "@ngx-share/buttons";
import {
  FontAwesomeModule,
  FaIconLibrary
} from "@fortawesome/angular-fontawesome";
import { QuillModule } from "ngx-quill";
import {
  SlugPipe,
  Nl2brPipe,
  KeepHtmlPipe,
  ContentPipe,
  LengthPipe,
  SummaryPipe
} from "./pipes";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FormlyModule } from "@ngx-formly/core";
import { FormlyMaterialModule } from "@ngx-formly/material";
import { FormlyFieldFile, FileValueAccessor, FormlyFieldQuill } from "./formly";
import { MetaService } from "./meta.service";
import { HighlightModule } from "ngx-highlightjs";
import {
  FileTypeComponent,
  FileTypeModule,
  FileTypeValidationMessages
} from "ngx-formly-material-file";

//material design
import {
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
  MatSnackBarModule
} from "@angular/material";

import { fab } from "@fortawesome/free-brands-svg-icons";
import { fas } from "@fortawesome/free-solid-svg-icons";

const routes: Routes = [
  { path: "editor", component: ContentEditorComponent }, // ex: /editor?type=jobs
  { path: "editor/:id", component: ContentEditorComponent },
  { path: "id/:id", component: ContentComponent },
  { path: ":category", component: ContentComponent },
  { path: ":category/manage", component: ContentManageComponent },
  { path: ":category/:item", component: ContentComponent }
];

export const APP_LOCALE_ID = "en-US";
export const fileTypeModule = FileTypeModule.forRoot();

@NgModule({
  declarations: [
    ContentComponent,
    ContentEditorComponent,
    ContentManageComponent,
    SlugPipe,
    Nl2brPipe,
    KeepHtmlPipe,
    ContentPipe,
    LengthPipe,
    SummaryPipe,
    FormlyFieldFile,
    FileValueAccessor,
    FormlyFieldQuill
  ],
  exports: [RouterModule],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    //fileTypeModule, //todo: error: unction calls are not supported in decorators but 'FileTypeModule' was called https://github.com/ng-packagr/ng-packagr/issues/1127#issuecomment-437351093 , https://github.com/alEX860111/ngx-formly-material-file/issues/1
    FormlyModule.forRoot({
      types: [
        { name: "file", component: FormlyFieldFile, wrappers: ["form-field"] }, //todo: add to component instead of module
        //  { name: "file", component: FileTypeComponent }, //from ngx-formly-material-file,
        { name: "quill", component: FormlyFieldQuill, wrappers: ["form-field"] }
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
    ShareButtonsModule,
    FontAwesomeModule,
    QuillModule.forRoot(),
    HighlightModule //todo: import common languages only https://ngx-highlight.netlify.com/
  ],
  providers: [MetaService, { provide: LOCALE_ID, useValue: APP_LOCALE_ID }],
  bootstrap: []
})
export class ContentModule {
  constructor(faIconLibrary: FaIconLibrary) {
    faIconLibrary.addIconPacks(fab, fas);
  }
}
