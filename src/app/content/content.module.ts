import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Routes, RouterModule } from "@angular/router";
import { ContentComponent } from "./index";
import { ContentCreateComponent } from "./create";
import { ContentManageComponent } from "./manage";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

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
  MatProgressBarModule
} from "@angular/material";
import { SlugPipe, ReplacePipe, Nl2brPipe, KeepHtmlPipe } from "./pipes";

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
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatCardModule,
    MatGridListModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressBarModule
  ],
  providers: [],
  bootstrap: []
})
export class ContentModule {}
