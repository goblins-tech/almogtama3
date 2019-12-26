import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ErrorComponent } from "./error/error.component";
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { HttpService } from "./http.service";
import { ContentModule } from "./content/content.module";
import { UniversalInterceptor } from "../../universal-interceptor";

const routes: Routes = [
  { path: "", redirectTo: "", pathMatch: "full" },
  {
    path: ":type",
    loadChildren: () =>
      import("./content/content.module").then(m => m.ContentModule)
  },

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
  declarations: [AppComponent, ErrorComponent],
  imports: [
    ContentModule,
    RouterModule.forRoot(routes, { enableTracing }),
    BrowserModule.withServerTransition({ appId: "serverApp" }),
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    HttpClientModule
  ],
  providers: [
    HttpService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UniversalInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
