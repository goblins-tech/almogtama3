const fs = require("fs");
const { execSync } = require("child_process");
const { argv } = require("process");
const jsDom = require("jsdom").JSDOM;

//todo: use async : if(isPromise(result))result.then->log(done)
const task = argv.slice(2)[0];
if (!task) console.error("enter a task");
else if (!(task in tasks)) console.error(`task ${task} not found`);
else
  try {
    console.log(`>> running the task: ${task}`);
    argv.slice(3).forEach(el => console.log(`  > ${el}`));
    tasks[task](...argv.slice(3));
    console.log(">> Done");
  } catch (err) {
    console.error(`>> error in task ${task}\n`, err);
  }

let tasks = {
  optimize: function(options = {}) {
    //optimize the bundle for production mode

    /*
     copy package.json to ./dist for firebase
     from cmd:
      - linux cp firebase/package.json dist/package.json
      - windows copy firebase\package.json dist\package.json
      */
    let package = JSON.parse(
      fs.readFileSync(`./package.json`, "utf8").toString()
    );
    package.main = package.main.replace("dist/", "");
    fs.writeFileSync(`${dist}/package.json`, JSON.stringify(package));

    //minify js files using terser
    //todo: minifying main-es2015.*.js causes 'null injector error' in /$type/editor
    let terser = function(dir) {
      fs.readdirSync(dir)
        .filter(el => el.endsWith(".js") && !el.includes("main-es2015."))
        .forEach(el => {
          el = `${dir}/${el}`;
          if (fs.statSync(el).isDirectory()) return this.terser(el);

          //todo: terser runtime-es2015 -> error: ngDevMode is not defined

          console.log(`>> terser ${el}`);
          execSync(
            `npx terser ${el} --output ${el} --compress --mangle --keep-fnames --ie8 --safari10`
          );
        });
    };
    terser("./dist");

    //transform index.html (lazy-load resources, and move them after 'load' event)
    //DOMParser() is not available in nodejs, so we use `jsdom`
    let content = fs.readFileSync(path, "utf8").toString();
    fs.writeFileSync(path + ".bkp", content);

    let dom = new jsDom(content).window.document,
      mainScript = dom.getElementById("main-script"),
      txt = "";

    dom.querySelectorAll("script").forEach(script => {
      if (!script.src) return; //todo: ||classList.includes["keep"]

      //todo: converting <script type="module"> to load() causes a blank page displayed.
      //even if they loaded.
      //let type = script.getAttribute("type");
      if (type == "module") return;

      /*
           - nomodule prevents the modern browsers to load the script,
             it instead, will load the "module" version
             https://stackoverflow.com/a/45947601/12577650
          */

      txt += `load("${script.src}","${type || "script"}",{${
        type === "module" ? "" : "nomodule:true,defer:true"
      }});\n`;

      script.remove();
    });

    dom.querySelectorAll("link").forEach(el => {
      if (el.rel !== "stylesheet") return;
      txt += `load("${el.href}","css");`;
      el.remove();
    });

    txt = `document.addEventListener("load", () => {${txt}});`;
    dom.createTextNode(txt);
    mainScript.append(txt);

    fs.writeFileSync(path, dom.documentElement.outerHTML);

    //the hashes for modified files is changed, so we need to rebuild ngsw-config with the new hashes
    execSync(`npx ngsw-config dist/browser ngsw-config.json`);
  }
};
