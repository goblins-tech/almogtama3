import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { ContentComponent } from "./content/content.component";
import { ErrorComponent } from "./error/error.component";

const routes: Routes = [
  {
    path: ":type/:id",
    component: ContentComponent
  },
  {
    path: "**",
    component: ErrorComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { enableTracing: true })], //todo: enableTracing:false
  exports: [RouterModule]
})
export class AppRoutingModule {}
