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
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { HttpService } from "./http.service";
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

const firebaseConfig = {
  apiKey: "AIzaSyAZ_fD4HflKU1rIb5zfi5IZ2_EMJSAT_Tk",
  authDomain: "almogtama3-eg.firebaseapp.com",
  databaseURL: "https://almogtama3-eg.firebaseio.com",
  projectId: "almogtama3-eg",
  storageBucket: "almogtama3-eg.appspot.com",
  messagingSenderId: "684865417357",
  appId: "1:684865417357:web:e4ff28c37e5336548cb2c4",
  measurementId: "G-59RT8HNS31"
};
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
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
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
    MatProgressBarModule,
    HttpClientModule
  ],
  providers: [HttpService],
  bootstrap: [AppComponent]
})
export class AppModule {}
