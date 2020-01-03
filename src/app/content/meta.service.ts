// import { types } from '../../projects/eldeeb/src/lib/index'; // todo: /// <reference types="eldeeb/index" />
//todo tags.author{name, email, url}
import { Injectable } from "@angular/core";
import {
  Meta as MetaTagsService,
  Title as TitleService
} from "@angular/platform-browser"; // for SSR: https://github.com/angular/angular/issues/15742#issuecomment-292892856

export namespace types {
  export interface Meta /* todo: extends types.Object*/ {
    title?: string;
    image_src?: string | [string, number, number]; // [src, width, height]

    [key: string]: any;
  }
}

@Injectable()
export class MetaService {
  constructor(
    private metaService: MetaTagsService,
    private titleService: TitleService
  ) {}

  setTags(tags: types.Meta = {}) {
    let defaultTags = {
      viewport: "width=device-width, initial-scale=1,maximum-scale=1.0",
      type: "website",
      "twitter:card": "summary_large_image",
      charset: "UTF-8",
      content: "text/html"
    };

    tags = Object.assign(defaultTags, tags);
    //console.log({ tags });

    tags.title = tags.title || tags.name;
    if (tags.title != tags.name) {
      tags.title += " | " + tags.name;
    }
    tags.description = tags.description || tags.desc;
    tags.image_src = tags.image_src || tags.image || tags.img;
    tags.url =
      (tags.baseUrl + tags.baseUrl.substr(-1) !== "/" ? "/" : "" || "") + // todo: check this line if baseUrl is empty or null
      (tags.url || tags.link || "");
    if (tags.image_src instanceof Array) {
      // [src,width,height] for og:image
      [
        tags["og:image"],
        tags["og:image:width"],
        tags["og:image:height"]
      ] = tags.image_src;
    } else {
      tags["og:image"] = tags.image_src;
    }
    tags["og:site_name"] = tags.name;
    tags["og:title"] = tags.title;
    tags["og:description"] = tags.description;
    tags["og:url"] = tags.url;
    tags["fb:app_id"] = tags["fb:app_id"] || tags.fb_app;
    tags["twitter:site"] =
      tags.hashtag!.substr(0, 1) !== "@" ? "@" : "" + tags.hashtag;
    tags["twitter:title"] = tags.title;
    tags["twitter:image"] = tags.image_src;
    tags["twitter:description"] = tags.description;

    delete tags.desc;
    delete tags.link;
    delete tags.image;
    delete tags.img;
    delete tags.fb_app;
    delete tags.baseUrl;

    // Set the title
    this.titleService.setTitle(tags.title);

    // set meta tags
    let _tags = [];
    for (let key in tags) {
      if (tags[key]) {
        _tags.push(this.prepare(key, tags[key]));
      }
    }

    this.metaService.addTags(_tags, false);
    // todo: icon, refresh:url | [url,time],
  }

  updateTags(tags: types.Meta) {
    // todo: when updating title 'for example', also update og:title, twitter:title, ...
    // there is no method called: this.metaService.updateTags()
    for (let key in tags) {
      this.metaService.updateTag(this.prepare(key, tags[key]));
    }
  }

  /**
   * converts {title: '==title=='} to {name: title, content:'==title=='}
   * @method prepare
   * @param  key     [description]
   * @param  value   [description]
   * @return [description]
   */
  prepare(key: string, value: any) {
    let prop: string;
    if (key.substr(0, 3) == "og:") {
      prop = "property";
    } else if (["charset"].includes(key)) {
      prop = key;
    } else if (key == "content") {
      prop = "httpEquiv";
      key = "Content-Type";
    } else if (key == "http-equiv" || key == "httpEquiv") {
      prop = "httpEquiv";
      [key, value] = value; // ex: {httpEquiv:['content','text/html']}
    } else if (key == "refresh") {
      prop = "httpEquiv";
      if (value instanceof Array) {
        value = `${value[0]}; URL='${value[1]}'`;
      }
    } else {
      prop = "name";
    }

    // todo: itemprop i.e: <meta name> VS <meta itemprop>
    return { [prop]: key, content: value };
  }

  filter(tags) {
    let allowed = ["title", "description", "content", "refresh"]; // todo: list all allowed meta tags

    Object.keys(tags)
      .filter(key => allowed.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: tags[key] }), {});

    /* using ES2019 fromEntries()
    return Object.fromEntries(
      Object.entries(tags).filter(([key, val]) => allowed.includes(key))
    );*/
  }
}
