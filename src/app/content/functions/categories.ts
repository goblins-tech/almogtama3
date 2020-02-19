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

    todo:
    - return array of categories & use <mat-tree>
    - use <mat-checkbox>, components must be dynamically loaded, Angular dosen't support
      injecting components into [innerHTML]
    - add btn to open a dialog to select categories  
   */

  createInputs(ctg?, filter?: ((el: any) => boolean) | string[], tab = "") {
    if (!ctg) ctg = this.getMain(false);
    let output = "";
    if (ctg instanceof Array) {
      if (filter) {
        if (filter instanceof Array)
          ctg = ctg.filter(el => filter.includes(el._id));
        //todo: el.startsWith("!")? !filter.includes(): filter.includes()
        else ctg = ctg.filter(filter);
      }
      ctg.forEach(el => (output += this.createInputs(el, null, tab)));
    } else {
      ctg = this.getCtg(ctg);
      output =
        tab +
        `<input type="checkbox" name="groups" value="${ctg._id}">${ctg.title}<br />`;
      //`<mat-checkbox name="groups" value="${ctg._id}">${ctg.title}</mat-checkbox><br />`;
      let childs = this.getChilds(ctg, true);
      if (childs.length > 0)
        output += this.createInputs(childs, null, tab + "&nbsp;".repeat(5));
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
