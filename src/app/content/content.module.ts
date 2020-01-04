import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Routes, RouterModule } from "@angular/router";
import { ContentComponent } from "./index";
import { ContentCreateComponent } from "./create";
import { ContentManageComponent } from "./manage";
import { ShareButtonsModule } from "@ngx-share/buttons";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { SlugPipe, ReplacePipe, Nl2brPipe, KeepHtmlPipe } from "./pipes";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FormlyModule } from "@ngx-formly/core";
import { FormlyMaterialModule } from "@ngx-formly/material";
import { FormlyFieldFile } from "./formly";
import { MetaService } from "./meta.service";

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

const routes: Routes = [
  { path: ":type", component: ContentComponent },
  { path: ":type/create", component: ContentCreateComponent },
  { path: ":type/manage", component: ContentManageComponent },
  { path: ":type/:item", component: ContentComponent } //item =  id-slug
];

@NgModule({
  declarations: [
    ContentComponent,
    ContentCreateComponent,
    ContentManageComponent,
    SlugPipe,
    ReplacePipe,
    Nl2brPipe,
    KeepHtmlPipe,
    FormlyFieldFile
  ],
  exports: [RouterModule],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    FormlyModule.forRoot({
      types: [
        { name: "file", component: FormlyFieldFile, wrappers: ["form-field"] } //todo: add to component instead of module
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
    FontAwesomeModule
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
