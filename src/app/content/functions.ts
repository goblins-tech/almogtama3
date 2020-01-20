import { objectType } from "../../../eldeeb/general";
import { DomSanitizer } from "@angular/platform-browser";

export type ContentValue = any; //todo: article{} | string
export interface Obj {
  [k: string]: any;
}

export function getValue(value, keys?: string | string[]) {
  if (objectType(value) == "object") {
    if (!(keys instanceof Array)) keys = [keys];
    for (let i = 0; i < keys.length; i++)
      if (value[keys[i]] && value[keys[i]] !== "") return value[keys[i]];
  }
  if (typeof value != "string") return "";
  return value;
}

export function slug(value: ContentValue, lngth = 200) {
  let slug = getValue(value, ["slug", "title"])
    .trim() //remove trailing spaces
    .replace(/\s+/g, "-") //replace inner spaces with '-'
    .replace("/", "") //replace '/' with '-', to prevent changing the current route ex: url/slug1-slug2 instead of /slug1/slug2
    .replace(/-{2,}/g, "-") //remove sequental slaches
    .replace(/^-+|-+$/g, ""); //remove trailing slashes, equivilant to php .trim('-'), starts or ends with one or more slashes

  return length(slug, lngth);
  //todo: remove unwanted charachters & very short words}
}
export function content(value: ContentValue) {
  return getValue(value, ["content"]).replace(/\r\n|\n\r|\r|\n/g, "<br />"); //nl2br
  //todo: KeepHTML, hypernate links,...
}
export function summary(value: ContentValue, lngth = 500, options: Obj = {}) {
  if (options.br !== false) options.br = true; //keep <br>
  return length(html2text(getValue(value, ["content"]), options), lngth);
}

export function html2text(value: string, options: Obj = {}) {
  /*
options:
 -br: true= use <br />, false= use \n
 -links: true= text (link.href), false= text
 */
  value = options.br
    ? value.replace(/<p(>| .*>)/gi, "<br />") // we need only <p> or <p .*>, but not <pxxx>
    : value.replace(/<br.*>/gi, "\n").replace(/<p(>| .*>)/gi, "\n");

  value = value.replace(
    /<a.*href="(.*?)".*>(.*?)<\/a>/gi,
    options.links ? " $2 ($1) " : " $2 "
  );

  return value
    .replace(/<(style|script|meta)[^>]*>.*<\/\1>/gm, "") //remove inline <style>, <script>, <meta> blocks
    .replace(/<[^>]+>/g, "") //strip html, or: /<(?:.|\s)*?>/
    .replace(/([\r\n]+ +)+/gm, ""); //remove leading spaces and repeated CR/LF
}

export function length(value: ContentValue, lngth = 0) {
  return lngth ? getValue(value).slice(0, lngth) : value;
}

export function nl2br(value: string) {
  return getValue(value).replace(/\r\n|\n\r|\r|\n/g, "<br />");
}

//prevent Angular from sanitizing DOM, https://angular.io/guide/security#xss
export function keepHtml(value: ContentValue, sanitizer?): string {
  //if (!sanitizer) sanitizer = new DomSanitizer(); //todo: error TS2511: Cannot create an instance of an abstract class.
  let content = getValue(value, "content");
  return sanitizer.bypassSecurityTrustHtml(content);
}
