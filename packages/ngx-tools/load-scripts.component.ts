import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit
} from "@angular/core";
import { NgxToolsLoadService } from "./load-scripts.service";

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
  @Input() type: string;
  @Input() parent: any;
  @Output() loaded = new EventEmitter<void>();
  @Output() ready = new EventEmitter<void>();

  constructor(private loadService: NgxToolsLoadService) {}

  ngAfterViewInit() {
    this.loadService.load(
      this.src,
      this.type,
      this.attributes,
      type => this.emit(type),
      this.parent
    );
  }

  emit(type: string) {
    this[type].emit();
  }
}
