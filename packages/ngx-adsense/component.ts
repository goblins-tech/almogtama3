import {
  Component,
  OnInit,
  ViewChild,
  ViewChildren,
  QueryList,
  Input,
  Output,
  EventEmitter
} from "@angular/core";

@Component({
  selector: "ngx-adsense",
  template: `
    <script
      id="adsense"
      data-ad-client="{{ id }}"
      async
      src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
    ></script>
  `
})
export class NgxAdsenseComponent {
  @Input() id: string; //ca-pub-**
}
