/*
todo:
 - if(!job.open | article.expire)show warning & disable apply btn (for jobs)
 - if(job) add fields (ex: contacts, salary, ..), add apply btn
 - add copy btn to each post
 - add copy-all btn to inde (or category) page (*ngIf=data.type=list){show ctg.title; add copy-all btn}
 */

import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { FormBuilder, Validators } from "@angular/forms";
import { Observable } from "rxjs";
import { MetaService } from "./meta.service";
import { HighlightJS } from "ngx-highlightjs";
import { QuillViewComponent } from "ngx-quill"; //todo: enable sanitizing https://www.npmjs.com/package/ngx-quill#security-hint
import { environment as env } from "../../environments/environment";
import { summary } from "./functions";
import { urlParams } from "../../../eldeeb/angular";

export interface Obj {
  [key: string]: any;
}
export interface Params extends Obj {
  category: string;
  id?: string;
}
export interface Article extends Obj {
  title: string;
  subtitle: string;
  content: string;
  keywords: string | string[];
  cover: string;
}
export interface Data {
  type: string; //item|index
  payload: Article | Article[];
}

const dev = !env.production;

@Component({
  selector: "app-content",
  templateUrl: "./index.html",
  styleUrls: ["./index.scss"]
})
export class ContentComponent implements OnInit, AfterViewInit {
  data$: Observable<Data>;
  data: Data;
  params: Params;
  layout = "grid";
  @ViewChild("quillView", { static: false }) quillView;
  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private meta: MetaService,
    private hljs: HighlightJS,
    private comp: ElementRef
  ) {}
  ngOnInit() {
    urlParams(this.route).subscribe(([params, query]) => {
      //ex:  /$ctg/$id-title
      let category = (params.get("category") || "").trim(),
        item = (params.get("item") || "").trim(),
        id = params.get("id");

      this.params = {
        category,
        id: id || item.substring(0, item.indexOf("-")) || item
      };

      if (dev) console.log({ params, query, calculatedParamas: this.params });

      this.getData().subscribe(data => {
        if (typeof data == "string") data = JSON.parse(data); //ex: the url fetched via a ServiceWorker

        //todo: import site meta tags from config
        let metaTags = {
          name: "almogtama3",
          hashtag: "@almogtama3", //todo: @hashtag or #hashtag for twitter??
          baseUrl: "https://www.almogtama3.com/"
        };

        if (data.payload) {
          if (data.type == "item") {
            this.meta.setTags({
              ...metaTags,
              description: summary((data.payload as Article).content),
              ...data.payload
            });

            if (this.params.type == "jobs")
              (data.payload as Article).content += `<div class='contacts'>${
                (data.payload as Article).contacts
              }</div>`;
          } else if (data.type == "list") {
            this.meta.setTags({ ...metaTags });
            //todo: meta tags from category
          }
        }

        this.data = data;
      });
    });
  }
  ngAfterViewInit() {
    //or this.hljs.initHighlighting().subscribe(); Applies highlighting to all <pre><code>..</code></pre> blocks on a page.
    //don't use document.querySelectorAll(..), it will search over all elements even those outside this component
    if (this.comp)
      this.comp.nativeElement
        .querySelectorAll("pre.ql-syntax")
        .forEach((item: any) => {
          this.hljs.highlightBlock(item).subscribe();
        });

    /*  document.querySelectorAll("pre.ql-syntax").forEach((item: any) => {
      this.hljs.highlightBlock(item).subscribe();
    });
*/
    if (this.quillView)
      this.quillView.nativeElement
        .querySelectorAll("pre.ql-syntax")
        .forEach((item: any) => {
          this.hljs.highlightBlock(item).subscribe();
        });

    let comp = this.comp.nativeElement;
    console.log("selector", {
      "pre.ql-syntax": comp.querySelectorAll("pre.ql-syntax"),
      pre: comp.querySelectorAll("pre"),
      ".ql-syntax": comp.querySelectorAll(".ql-syntax"),
      "quill-editor": comp.querySelectorAll("quill-editor"),
      p: comp.querySelectorAll("p"),
      html: comp.querySelectorAll("html")
    });

    //activate adsense
    if (dev) {
      let adsense = document.getElementById("adsense");
      if (adsense) {
        //adsense.setAttribute("data-ad-client", "ca-pub-8421502147716920"); //todo: ad sharing
        let adsenseSrc = adsense.dataset.src; //to avoid warning: adSense head tag doesn't support data-src attribut
        adsense.removeAttribute("data-src");
        adsense.setAttribute("src", adsenseSrc);
      }
    } else console.warn("adsense disabled in dev mode.");
  }
  getData() {
    return this.httpService.get<Data>({
      id: this.params.id,
      category: this.params.category
    });
  }
}
