import {
  Component,
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
  selector: "ngx-script",
  template: ``
})
export class NgxToolsScriptComponent implements AfterViewInit {
  @Input() attributes: { [key: string]: any };
  @Input() src: string;
  @Input() async: boolean = true;
  @Output() loaded = new EventEmitter<void>();
  @Output() ready = new EventEmitter<void>();

  constructor(
    @Inject(DOCUMENT) private document,
    private elementRef: ElementRef
  ) {}

  ngAfterViewInit() {
    let s = this.document.createElement("script");
    s.src = this.src;
    s.type = "text/javascript";
    if (this.attributes) {
      for (let key in this.attributes) {
        s.setAttribute(key, this.attributes[key]);
      }
    }
    s.onload = () => this.onLoaded();
    s.onreadystatechange = () => this.onReady();

    //no need to use s.async=true; because dynamically loaded scripts are async by default
    if (this.async) s.setAttribute("async", true);

    //todo: or add to document.head
    this.elementRef.nativeElement.appendChild(s);
  }

  onLoaded() {
    this.loaded.emit();
  }
  onReady() {
    this.ready.emit();
  }
}
