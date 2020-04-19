//a package that contains all content modules (view, editor, manager, API, ...)
import { NgModule } from "@angular/core";
import { ContentViewModule } from "./view/module";

@NgModule({
  exports: [ContentViewModule],
  imports: []
})
export class ContentModule {}
