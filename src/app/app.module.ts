import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ErrorComponent } from "./error";
import { AngularFireModule } from "@angular/fire";
import { AngularFireAuthModule } from "@angular/fire/auth";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { HttpService } from "./http.service";
import { ContentModule } from "./content/content.module";
import { UniversalInterceptor } from "../../universal-interceptor";
import { MetaService } from "./content/meta.service";
import { SocialComponent } from "./social";

/*
routes are devided into routes (for AppRutingModule) & appRoutes (for AppModule)
because Modules are proceeded befor RouterModule.forRoot() and RouterModule.forChild()
we need to load AppRutingModule first then routes defineded in ContentModule (contains RouterModule.forChild())
then appRoutes in the last (because it contains '**')
 */
const routes: Routes = [{ path: "social", component: SocialComponent }];
const appRoutes: Routes = [
  { path: "", redirectTo: "", pathMatch: "full" },
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
  imports: [RouterModule.forRoot(routes, { enableTracing })],
  exports: [RouterModule]
})
export class AppRoutingModule {}

@NgModule({
  declarations: [AppComponent, ErrorComponent, SocialComponent],
  imports: [
    RouterModule.forRoot(appRoutes, { enableTracing }), //will be proceed after AppRutingModule and ContentModule
    BrowserModule.withServerTransition({ appId: "serverApp" }),
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    HttpClientModule,
    AppRoutingModule, //Modules will process before RouterModule.forRoot() https://blogs.msmvps.com/deborahk/angular-route-ordering/
    ContentModule //must be after AppRoutingModule
  ],
  providers: [
    HttpService,
    MetaService, //todo: only provide this service in content.module
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UniversalInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  /*
  constructor(router: Router) {
    //test the routers' order; inject Router i.e:constructor(router: Router->from @angular/router)
    const replacer = (key, value) =>
      typeof value === "function" ? value.name : value;
    console.log("Routes: ", JSON.stringify(router.config, replacer, 2));

  }*/
}
