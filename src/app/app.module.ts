import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { Routes, RouterModule, Router, ExtraOptions } from "@angular/router";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ErrorComponent } from "./error";
//import { AngularFireModule } from "@angular/fire";
//import { AngularFireStorageModule } from "@angular/fire/storage";
//import { AngularFireAuthModule } from "@angular/fire/auth";
//import { FIREBASE } from "../config/firebase";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { HttpService } from "./http.service";
import { ContentModule } from "./content/module";
import { FormModule } from "./forms/forms.module";
import { UniversalInterceptor } from "../../universal-interceptor";
import { MetaService } from "pkg/ngx-tools/meta.service";
import { NgxToolsLoadService } from "pkg/ngx-tools/load-scripts.service";
import { SocialComponent } from "./social";
import { ServiceWorkerModule } from "@angular/service-worker";
import env from "../env";
import { NgxLoadingModule } from "ngx-loading";
import { MatToolbarModule } from "@angular/material/toolbar";

/*
routes are devided into routes (for AppRutingModule) & appRoutes (for AppModule)
because Modules are proceeded befor RouterModule.forRoot() and RouterModule.forChild()
we need to load AppRutingModule first then routes defineded in ContentModule (contains RouterModule.forChild())
then appRoutes in the last (because it contains '**')
 */

const routes: Routes = [{ path: "social", component: SocialComponent }];
const appRoutes: Routes = [{ path: "**", component: ErrorComponent }];

let routerOptions: ExtraOptions = {
  enableTracing: false, //true to trace routing navigations in dev mode
  initialNavigation: "enabled",
  anchorScrolling: "enabled"
};

@NgModule({
  imports: [
    //todo: add {initialNavigation: 'enabled' } same as AppModule?
    RouterModule.forRoot(routes, routerOptions),
    ServiceWorkerModule.register("ngsw-worker.js", { enabled: true })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

@NgModule({
  declarations: [AppComponent, ErrorComponent, SocialComponent],
  imports: [
    RouterModule.forRoot(appRoutes, routerOptions), //will be proceed after AppRutingModule and ContentModule
    BrowserModule.withServerTransition({ appId: "serverApp" }),
    BrowserAnimationsModule,
    //AngularFireModule.initializeApp(FIREBASE),
    //AngularFireStorageModule,
    //AngularFireAuthModule,
    HttpClientModule,
    AppRoutingModule, //Modules will process before RouterModule.forRoot() https://blogs.msmvps.com/deborahk/angular-route-ordering/
    FormModule,
    ContentModule, //must be after other modules, because it's first part is dynamic :item/..
    NgxLoadingModule.forRoot({
      primaryColour: "red",
      secondaryColour: "blue",
      tertiaryColour: "green"
    }),
    MatToolbarModule
  ],
  providers: [
    HttpService,
    MetaService,
    NgxToolsLoadService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UniversalInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(router: Router) {
    //test the routers' order;
    if (env.dev) console.log("Routes: ", router.config);
  }
}
