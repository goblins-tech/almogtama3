import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  AfterViewInit,
  Inject,
  SimpleChanges
} from "@angular/core";
import { DOCUMENT } from "@angular/common";

/*
angular dosen't allow to use <script> inside the template, so we dynamically load it.
 */
@Component({
  selector: "ngx-adsense",
  template: `
    <ngx-script
      [src]="src || '//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'"
      (loaded)="onLoaded()"
      (ready)="onReady()"
      [attributes]="attributes"
    ></ngx-script>
  `
})
export class NgxAdsenseComponent {
  @Input() id: string; //ca-pub-**
  @Input() src: string;
  @Input() attributes: { [key: string]: any } = {};
  @Output() loaded = new EventEmitter<void>();
  @Output() ready = new EventEmitter<void>();

  ngOnInit() {
    this.attributes["data-ad-client"] = this.id;
  }

  ngOnChanges(changes: SimpleChanges) {
    if ("attributes" in changes && changes.attributes.currentValue) {
      this.attributes["data-ad-client"] = this.id;
    }
  }

  onLoaded() {
    this.loaded.emit();
  }

  onReady() {
    this.ready.emit();
  }
}
