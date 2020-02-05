import { objectType } from "../../../eldeeb/general";
import { DomSanitizer, ɵDomSanitizerImpl } from "@angular/platform-browser";

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

/**
 * [slug description]
 * @method slug
 * @param  value           [description]
 * @param  lngth=200       [description]
 * @param  allowedChars="" regex style ex: a-z0-9
 * @return [description]
 */
export function slug(value: ContentValue, lngth = 200, allowedChars = "") {
  let lang = {
    ar: "أابتثجحخدذرزسشصضطظعغفقكلمنهويىآئءلألإإآة"
  };

  allowedChars = allowedChars
    .split("|")
    .map(el => (el.startsWith(":") ? lang[el.substr(1)] : ""))
    .join("");
  let slug = getValue(value, ["slug", "title"])
    .trim() //remove trailing spaces
    .replace(new RegExp(`[^a-z0-9-._~${allowedChars}]`, "gi"), "-") //remove unallowed charachters
    .replace(/\s+/g, "-") //replace inner spaces with '-'
    //.replace("/", "") //replace '/' with '-', to prevent changing the current route ex: url/slug1-slug2 instead of /slug1/slug2
    .replace(/-{2,}/g, "-") //remove sequental slaches
    .replace(/^-+|-+$/g, ""); //remove trailing slashes, equivilant to php .trim('-'), starts or ends with one or more slashes

  return length(encodeURIComponent(slug), lngth);
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

export function length(value: string, lngth = 0) {
  return lngth ? value.slice(0, lngth) : value;
}

export function nl2br(value: string) {
  return getValue(value).replace(/\r\n|\n\r|\r|\n/g, "<br />");
}

//prevent Angular from sanitizing DOM, https://angular.io/guide/security#xss
export function keepHtml(value: ContentValue, sanitizer?): string {
  let content = getValue(value, "content");
  //  if (!sanitizer) sanitizer = new DomSanitizer(); //todo: error TS2511: Cannot create an instance of an abstract class.
  //also ɵDomSanitizerImpl();needs 1 argument constructor(_doc)
  //  return sanitizer.bypassSecurityTrustHtml(content);
  return content;
}

export class Categories {
  ctg;
  constructor(categories) {
    this.ctg = categories;
  }

  // add main[] & branches, parents, top to every category
  adjust() {
    let main = this.getMain();
    let categories = this.ctg.map(ctg => {
      let parents = this.getParents(ctg);
      ctg.branches = this.getBranches(ctg._id);
      ctg.parents = parents;
      ctg.top = this.getTop(ctg, parents, main);
      return ctg;
    });

    return { main, categories };
  }

  //convert categories[{}] into ids[]
  ids(ctg) {
    return ctg.map(el => (typeof el == "string" ? el : el._id));
  }

  //get category{} from id
  getCtg(id) {
    return typeof id == "string" ? this.ctg.find(el => el._id == id) || {} : id;
  }

  //main categories i.e: have no parent
  getMain(ids = true) {
    let data = this.ctg.filter(el => !el.parent);
    return ids ? this.ids(data) : data;
  }

  //top-level category of the carent one
  getTop(ctg, parents, ids = true) {
    let main = this.getMain(true);
    if (!parents) parents = this.getParents(ctg, true);

    let top = this.getParents(ctg, true).find(el => main.includes(el));
    return ids ? top : this.getCtg(top);
  }

  //get childs of this category
  getChilds(id, ids = true) {
    if (typeof id != "string") id = id._id;
    let data = this.ctg.filter(el => el.parent == id);
    return ids ? this.ids(data) : data;
  }

  //get childs and childs of childs etc..
  getBranches(ctg, ids = true) {
    if (typeof ctg != "string") ctg = ctg._id;
    let branches = [];
    let childs = this.getChilds(ctg, ids); //ids[] or els[]

    if (childs.length > 0) {
      branches.push(...childs);
      childs.forEach(el => {
        let childsOfChilds = this.getBranches(ids ? el : el._id, ids);
        if (childsOfChilds.length > 0) branches.push(...childsOfChilds);
      });
    }

    return [...new Set(branches)]; //get unique items
  }

  //get parent and parent pf parent etc...
  getParents(ctg, ids = true) {
    let parents = [];
    ctg = this.getCtg(ctg);
    if (!ctg) return [];
    let parent = ctg.parent;
    if (parent) {
      parents.push(ids ? parent : this.getCtg(parent));
      let parentsOfParent = this.getParents(parent, ids);
      if (parentsOfParent.length > 0) parents.push(...parentsOfParent);
    }
    return parents;
    // parents.map() may be applied internally for parentsOfParent,
    //so, applying it again here will cause an error
    //WRONG: return ids ? parents : parents.map(id => this.getCtg(id));
  }

  //create checkboxes tree
  /*
  ex:
    var inputs = c.createInputs(null, "", ["5ac348980d63be4aa0e967a2"]);
    fs.writeFileSync("./inputs.html", inputs);
   */
  createInputs(ctg, tab = "", execlude = []) {
    if (!ctg) ctg = this.getMain(false);
    let output = "";
    if (ctg instanceof Array) {
      ctg.forEach(el => {
        if (!execlude.includes(el._id)) output += this.createInputs(el, tab);
      });
    } else {
      ctg = this.getCtg(ctg);
      output =
        tab +
        `<input type="checkbox" name="groups" value="${ctg._id}">${ctg.title}<br />`;
      let childs = this.getChilds(ctg, true);
      if (childs.length > 0)
        output += this.createInputs(childs, tab + "&nbsp;".repeat(5));
    }

    return output;
  }
}

export class ArticlesCategories {
  ctg;
  data;
  constructor(articlesCategories, categories) {
    if (!(categories instanceof Categories))
      categories = new Categories(categories);

    this.ctg = categories;
    this.data = articlesCategories;
  }

  //returns {article_categories, category_articles}
  adjust() {
    return {
      categoryArticles: this.categoryArticles(),
      articleCategories: this.articleCategories()
    };
  }

  //get categories related to each article
  articleCategories() {
    let articles = [];
    let result = {};
    this.data.forEach(el => {
      if (!articles.includes(el.article)) {
        result[el.article] = this.getCategories(el.article, true);
        articles.push(el.article);
      }
    });
    return result;
  }

  //get articles related to each category and it's branches
  //main: if true: get articles from main categories only,
  //useful for index page to show $n articles from each main category
  categoryArticles(main = false) {
    let ctgs = main ? this.ctg.getMain(true) : this.ctg.ids(this.ctg.ctg);
    let result = {};
    ctgs.forEach(ctg => {
      result[ctg] = this.getArticles(ctg, true);
    });
    return result;
  }

  //get articles from this category and it's brances
  getArticles(category, ids = true) {
    if (typeof category !== "string") category = category._id;
    let categories = [category, ...this.ctg.getBranches(category, true)];
    let articleIds = []; //to get unique articles
    let result = this.data.filter(el => {
      articleIds.push(el.ids);
      return categories.includes(el.category) && !articleIds.includes(el._id);
    });
    return ids ? this.ctg.ids(result) : result; //or [...SET(articleIds)]
  }

  //get categories that this article belongs to
  getCategories(article, ids = true) {
    if (!article) return [];
    if (typeof article !== "string") article = article._id;
    let result = this.data.filter(el => el.article == article);
    return ids ? this.ctg.ids(result) : result;
  }
}

/*
//or extends ProgressEvent; https://stackoverflow.com/a/35790786
interface FileReaderEventTarget extends EventTarget {
  result: string;
}

export interface FileReaderEvent extends Event {
  target: FileReaderEventTarget;
  getMessage(): string;
}

//usage: $("#img").attr("src", imgPreview(form.files[0]));
//http://jsfiddle.net/LvsYc/638/
//todo: return Observable
export function imgPreview(file: FileReaderEvent) {
  //todo: file:blob not FileReaderEvent
  if (file) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(e) {
      return e.target.result;
    };
  }
}
*/
