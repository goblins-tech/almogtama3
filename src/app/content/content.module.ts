import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Routes, RouterModule } from "@angular/router";
import { ContentComponent } from "./index";
import { ContentCreateComponent } from "./create";
import { ContentManageComponent } from "./manage";
import { ShareButtonsModule } from "@ngx-share/buttons";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { SlugPipe, ReplacePipe, Nl2brPipe, KeepHtmlPipe } from "./pipes";
import { ReactiveFormsModule } from "@angular/forms";
import { FormlyModule } from "@ngx-formly/core";
import { FormlyMaterialModule } from "@ngx-formly/material";

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
  { path: "", component: ContentComponent },
  { path: "create", component: ContentCreateComponent },
  { path: "manage", component: ContentManageComponent },
  { path: ":item", component: ContentComponent } //item =  id-slug
];

@NgModule({
  declarations: [
    ContentComponent,
    ContentCreateComponent,
    ContentManageComponent,
    SlugPipe,
    ReplacePipe,
    Nl2brPipe,
    KeepHtmlPipe
  ],
  exports: [RouterModule],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    FormlyModule.forRoot(),
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
  providers: [],
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
