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

/*
currently aot doesn't support lambda or anonumous functions,
so we need to export the function and then pass it to matcher
Wrong: matcher:function(url){} or matcher:url=>{}
correct: export function something(url){}  matcher:something

error:
 Function expressions are not supported in decorators
 Consider changing the function expression into an exported function

it will work in dev mode, but gives error in prod mode (i.e: when --aot enabled).

https://angular.io/guide/aot-metadata-errors#function-calls-not-supported
https://angular.io/guide/aot-compiler#function-expression
https://medium.com/angular-in-depth/solving-aot-error-in-ngrx-function-calls-are-not-supported-in-decorators-5c337381457a
 */
export function editorMatcher(url) {
  return url.length > 1 &&
    ["jobs", "articles"].includes(url[0].path) &&
    url[1].path == "editor"
    ? {
        consumed: url,
        posParams: {
          type: new UrlSegment(url[0].path, {}),
          id: new UrlSegment(url[2] ? url[2].path : null, {})
        }
      }
    : null;
}

export function manageMatcher(url) {
  return url.length == 2 &&
    ["jobs", "articles"].includes(url[0].path) &&
    url[1].path == "manage"
    ? {
        consumed: url,
        posParams: {
          type: new UrlSegment(url[0].path, {})
        }
      }
    : null;
}

export function contentMatcher(url) {
  return (url.length == 1 || url.length == 2) &&
    ["jobs", "articles"].includes(url[0].path)
    ? {
        consumed: url,
        posParams: {
          type: new UrlSegment(url[0].path, {}),
          item: new UrlSegment(url[1] ? url[1].path : null, {}) //todo: error: Cannot read property 'path' of null
        }
      }
    : null;
}
const routes: Routes = [
  {
    // (jobs|articles)/editor/:id
    matcher: editorMatcher,
    component: ContentEditorComponent
  },
  {
    // (jobs|articles)/manage
    matcher: manageMatcher,
    component: ContentManageComponent
  },
  {
    // (jobs|articles)/:id
    matcher: contentMatcher,
    component: ContentComponent
  },

  //arbitrary content type ex: /content/test/editor
  //todo: error: clicking on the article title link will nagigate to /:type/:item instead of /content/:type/:item
  //solutions: 1- pass content:boolean to paramMap, 2-use angular navigator
  { path: "content/:type", component: ContentComponent },
  { path: "content/:type/editor", component: ContentEditorComponent },
  { path: "content/:type/editor/:id", component: ContentEditorComponent },
  { path: "content/:type/manage", component: ContentManageComponent },
  { path: "content/:type/:item", component: ContentComponent }
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
