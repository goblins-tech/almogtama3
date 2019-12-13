import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ContentComponent } from "./content/index";
import { ContentCreateComponent } from "./content/create";
import { ContentManageComponent } from "./content/manage";
import { ErrorComponent } from "./error/error.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";
import { HttpService } from "./http.service";
import {
  MatFormFieldModule,
  MatInputModule,
  MatOptionModule,
  MatSelectModule,
  MatCardModule,
  MatGridListModule,
  MatButtonModule,
  MatIconModule
} from "@angular/material";

const routes: Routes = [
  { path: "", redirectTo: "", pathMatch: "full" },
  { path: "test/:optional?", component: ContentComponent },
  { path: ":type/create", component: ContentCreateComponent },
  { path: ":type/manage", component: ContentManageComponent },
  { path: ":type/:item", component: ContentComponent },
  { path: ":type", redirectTo: ":type/" }, //make :item optional
  { path: "**", component: ErrorComponent }
];

let enableTracing = false; //true to trace routing navigations in dev mode
@NgModule({
  declarations: [
    AppComponent,
    ContentComponent,
    ContentCreateComponent,
    ContentManageComponent,
    ErrorComponent
  ],
  imports: [
    RouterModule.forRoot(routes, { enableTracing }),
    BrowserModule.withServerTransition({ appId: "serverApp" }),
    BrowserAnimationsModule,
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
    HttpClientModule
  ],
  providers: [HttpService],
  bootstrap: [AppComponent]
})
export class AppModule {}
