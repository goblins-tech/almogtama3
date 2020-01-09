import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CreateComponent } from "./create";
import { IndexComponent } from "./index"; //show the form ()
import { ViewComponent } from "./view"; //shows user's forms list & form data (item details)
import { Routes, RouterModule } from "@angular/router";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

const routes: Routes = [
  { path: "forms", component: IndexComponent },
  { path: "forms/editor", component: CreateComponent },
  { path: "forms/editor/:id", component: CreateComponent },
  { path: "forms/data/:id", component: ViewComponent },
  { path: "forms/:item", component: IndexComponent }
];

@NgModule({
  declarations: [CreateComponent, IndexComponent, ViewComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule
  ]
})
export class FormModule {}
