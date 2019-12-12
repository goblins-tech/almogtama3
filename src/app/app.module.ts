import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AppComponent } from "./app.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ContentComponent } from "./content/content.component";
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
  { path: "test", component: ContentComponent },
  { path: ":type/:id", component: ContentComponent },
  { path: "**", component: ErrorComponent }
];

@NgModule({
  declarations: [AppComponent, ContentComponent, ErrorComponent],
  imports: [
    RouterModule.forRoot(routes, { enableTracing: true }), //todo: enableTracing:false
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
