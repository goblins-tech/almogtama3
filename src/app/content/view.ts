/*
todo:
 - if(!job.open | article.expire)show warning & disable apply btn (for jobs)
 - if(job) add fields (ex: contacts, salary, ..), add apply btn
 - add copy btn to each post
 - add copy-all btn to inde (or category) page (*ngIf=data.type=list){show ctg.title; add copy-all btn}
 */

import { Data, Article, MetaService } from "pkg/ngx-content/view";
import { slug } from "pkg/ngx-content/core";
import { metaTags as _metaTags } from "../../config/front";

import {
  Component,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { HttpService } from "../http.service";
import { Observable } from "rxjs";
import { map, concatMap } from "rxjs/operators";
import { HighlightJS } from "ngx-highlightjs";
import env from "../../env";
import { summary } from "./functions";
import { urlParams } from "pkg/ngx-tools/routes";

//todo: import module & interfaces from packages/content/ngx-content-view/index.ts

export interface Obj {
  [key: string]: any;
}

export interface Params extends Obj {
  category: string;
  id?: string;
  refresh?: boolean;
  type?: string;
}

@Component({
  selector: "content-view",
  templateUrl: "./view.html",
  styleUrls: ["./view.scss"]
})
export class ContentComponent implements OnInit, AfterViewInit {
  @ViewChild("quillView") quillView;
  data$: Observable<Data>;
  params: Params;
  pref = { layout: "grid" };
  dev = env.dev; //to disable adsense in dev mode

  //todo: share adsense by changeing this value based on the article's author
  adsense = "ca-pub-8421502147716920";
  constructor(
    private route: ActivatedRoute,
    private httpService: HttpService,
    private meta: MetaService,
    private hljs: HighlightJS,
    private comp: ElementRef
  ) {}
  ngOnInit() {
    this.data$ = urlParams(this.route).pipe(
      map(([params, query]) => {
        let type = params.get("type") || "articles",
          category = params.get("category"),
          item = params.get("item"); //item may be: id or slug-text=id

        this.params = {
          type,
          category,
          //get last part of a string https://stackoverflow.com/a/6165387/12577650
          //using '=' (i.e /slug=id) will redirect to /slug
          id: item && item.indexOf("@") !== -1 ? item.split("@").pop() : item,
          refresh: !!query.get("refresh")
        };

        if (env.dev)
          console.log({ params, query, calculatedParamas: this.params });
        return this.params;
      }),
      //we use concatMap here instead of map because it immits Observable (this.getData())
      // so we flatten the inner Obs. i.e: it subscribes to the inner Obs. (this.getData) instead of the outer one (urlParams())
      //also we use concatMap and not mergeMap, to wait until the previous Obs. to be completed.
      concatMap(params => this.getData()),
      map(data => {
        if (typeof data === "string") data = JSON.parse(data); //ex: the url fetched via a ServiceWorker

        //todo: import site meta tags from config

        //todo: item.cover = {{item.type}}/{{item.id}}/{{item.cover}}
        let metaTags;
        if (data instanceof Array) {
          <Article[]>data.map(item => {
            item.id = item._id;
            item.content = item.summary || summary(item.content);
            if (!item.slug || item.slug == "") item.slug = slug(item.title);
            if (item.cover) {
              let src = `/api/v1/image/${this.params.type}-cover-${item._id}/${item.slug}.webp`,
                srcset = "";
              for (let i = 1; i < 10; i++) {
                srcset += `${src}?size=${i * 250} ${i * 250}w, `;
              }
              item.cover = { src, srcset, alt: item.title };
            }

            //todo: this needs to add 'categories' getData()
            //todo: get category.slug
            if (!item.link)
              item.link =
                `/${this.params.type}/` +
                (item.categories && item.categories.length > 0
                  ? `${item.categories[0]}/${item.slug}@${item.id}`
                  : `item/${item.id}`);

            item.author = {
              name: "author name",
              img: "assets/avatar-female.png",
              link: ""
            };
            item.date = "1/1/2020";
            return item;
          });

          metaTags = _metaTags;
        } else {
          data = <Article>data;
          data.id = data._id;

          data.summary = data.summary || summary(data.content);
          if (!data.link)
            data.link =
              data.categories && data.categories.length > 0
                ? `/${data.categories[0]}/${data.id}-${data.slug}`
                : `/id/${data.id}`;

          data.author = {
            name: "author name",
            img: "assets/avatar-female.png",
            link: ""
          };

          data.date = "1/1/2020";
          metaTags = {
            ..._metaTags,
            ...data,
            description: data.summary
          };

          if (data.cover) {
            let src = `/api/v1/image/${this.params.type}-cover-${data._id}/${data.slug}.webp`,
              srcset = "";
            for (let i = 1; i < 10; i++) {
              srcset += `${src}?size=${i * 250} ${i * 250}w, `;
            }
            data.cover = { src, srcset, alt: data.title };
          }

          if (this.params.type == "jobs")
            data.content += `<div id='contacts'>${data.contacts}</div>`;
        }
        this.meta.setTags(metaTags);
        return data;
      })
    );

    //this.data$.subscribe(x => console.log("this.data:", x));
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
    if (env.dev)
      console.log("selector", {
        "pre.ql-syntax": comp.querySelectorAll("pre.ql-syntax"),
        pre: comp.querySelectorAll("pre"),
        ".ql-syntax": comp.querySelectorAll(".ql-syntax"),
        "quill-editor": comp.querySelectorAll("quill-editor"),
        p: comp.querySelectorAll("p"),
        html: comp.querySelectorAll("html")
      });
  }
  getData(): Observable<Data> {
    //todo: ?docs="_id title subtitle slug summary author cover categories updatedAt"
    return this.httpService.get<Data>(this.params);
  }
}
