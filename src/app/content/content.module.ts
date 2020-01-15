import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Routes, RouterModule, UrlSegment } from "@angular/router";
import { ContentComponent } from "./index";
import { ContentEditorComponent } from "./editor";
import { ContentManageComponent } from "./manage";
import { ShareButtonsModule } from "@ngx-share/buttons";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { QuillModule } from "ngx-quill";
import {
  SlugPipe,
  ReplacePipe,
  Nl2brPipe,
  KeepHtmlPipe,
  ContentPipe,
  LengthPipe
} from "./pipes";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FormlyModule } from "@ngx-formly/core";
import { FormlyMaterialModule } from "@ngx-formly/material";
import { FormlyFieldFile, FormlyFieldQuill } from "./formly";
import { MetaService } from "./meta.service";
import { HighlightModule } from "ngx-highlightjs";

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

//fontawsome icons
import { library as fontAwsome } from "@fortawesome/fontawesome-svg-core";

import {
  faFacebookF,
  faTwitter,
  faRedditAlien,
  faLinkedinIn,
  faGooglePlusG,
  faTumblr,
  faPinterestP,
  faWhatsapp,
  faFacebookMessenger,
  faTelegramPlane,
  faMix,
  faXing,
  faLine
} from "@fortawesome/free-brands-svg-icons";
import {
  faCommentAlt,
  faMinus,
  faEllipsisH,
  faLink,
  faExclamation,
  faPrint,
  faCheck,
  faEnvelope,
  faBook,
  faLightbulb,
  faCoffee,
  faInfo
} from "@fortawesome/free-solid-svg-icons";

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
          id: url[2] ? new UrlSegment(url[2].path, {}) : null
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
          item: url[1] ? new UrlSegment(url[1].path, {}) : null
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

@NgModule({
  declarations: [
    ContentComponent,
    ContentEditorComponent,
    ContentManageComponent,
    SlugPipe,
    ReplacePipe,
    Nl2brPipe,
    KeepHtmlPipe,
    ContentPipe,
    LengthPipe,
    FormlyFieldFile,
    FormlyFieldQuill
  ],
  exports: [RouterModule],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    FormlyModule.forRoot({
      types: [
        { name: "file", component: FormlyFieldFile, wrappers: ["form-field"] }, //todo: add to component instead of module
        { name: "quill", component: FormlyFieldQuill, wrappers: ["form-field"] }
      ]
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
  providers: [MetaService],
  bootstrap: []
})
export class ContentModule {
  constructor() {
    fontAwsome.add(
      faFacebookF,
      faTwitter,
      faLinkedinIn,
      faGooglePlusG,
      faPinterestP,
      faRedditAlien,
      faTumblr,
      faWhatsapp,
      faFacebookMessenger,
      faTelegramPlane,
      faMix,
      faXing,
      faCommentAlt,
      faLine,
      faEnvelope,
      faCheck,
      faPrint,
      faExclamation,
      faLink,
      faEllipsisH,
      faMinus
    );
  }
}
