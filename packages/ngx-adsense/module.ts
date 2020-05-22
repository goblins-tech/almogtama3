import { NgModule } from "@angular/core";
import { NgxAdsenseComponent } from "./component";
import { NgxToolsScriptComponent } from "pkg/ngx-tools";

@NgModule({
  declarations: [NgxAdsenseComponent, NgxToolsScriptComponent],
  imports: [],
  exports: [NgxAdsenseComponent]
})
export class NgxAdsenseModule {}
