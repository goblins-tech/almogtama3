import {
  Component,
  OnInit,
  ViewChild,
  ViewChildren,
  QueryList,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  AfterViewInit,
  Inject
} from "@angular/core";
import { DOCUMENT } from "@angular/common";

/*
angular dosen't allow to use <script> inside the template, so we dynamically load it.
 */
@Component({
  selector: "ngx-adsense",
  template: ``
})
export class NgxAdsenseComponent implements AfterViewInit {
  @Input() id: string; //ca-pub-**
  @Input() src: string;
  constructor(
    @Inject(DOCUMENT) private document,
    private elementRef: ElementRef
  ) {}

  ngAfterViewInit() {
    var s = this.document.createElement("script");
    s.type = "text/javascript";
    s["data-ad-client"] = this.id;
    s.src =
      this.src || "//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    //no need to use s.async=true; because dynamically loaded scripts are async by default
    // s.onload = function () { __this.afterScriptAdded(); }; //__this=this

    //todo: or add to document.head
    this.elementRef.nativeElement.appendChild(s);
  }
}
