import { Injectable, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";

//todo: do we need to make this class as a service, or just a function?
//don't forget to add this service to ngModule.provide[]
@Injectable()
export class NgxToolsLoadService {
  constructor(@Inject(DOCUMENT) private document) {}

  load(
    src,
    type = "script",
    attributes: { [key: string]: any } = {},
    cb?: (type: string) => void,
    parent? //todo: HtmlElement
  ) {
    if (type == "css") {
      type = "link";
      attributes.rel = "stylesheet";
      attributes.type = "text/css";
    }

    if (type === "link") {
      attributes.href = src;
      attributes.crossorigin = true; //https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content#Cross-origin_fetches
    } else if (type == "script") {
      attributes.src = src;
      attributes.type = "text/javascript";
    }

    if (!("async" in attributes)) attributes.async = true;

    let el = this.document.createElement(type);
    for (let key in attributes) {
      el.setAttribute(key, attributes[key]);
    }

    if (cb) {
      el.onload = () => cb("loaded");
      el.onreadystatechange = () => cb("ready");
    }

    (parent || this.document.getElementsByTagName("head")[0]).appendChild(el);
  }
}
