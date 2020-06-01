const fs = require("fs");
const { execSync } = require("child_process");
const { argv } = require("process");
const jsDom = require("jsdom").JSDOM;

var tasks = {
  terser: function(dir = "./dist") {
    fs.readdirSync(dir).forEach(el => {
      let newDir = `${dir}/${el}`;
      if (fs.statSync(newDir).isDirectory()) this.terser(newDir);
      else {
        //todo: terser runtime-es2015 -> error: ngDevMode is not defined
        if (newDir.endsWith(".js") && !newDir.includes("main-es2015.")) {
          console.log(`>> terser ${newDir}`);
          execSync(
            `npx terser ${newDir} --output ${newDir} --compress --mangle --keep-fnames --ie8 --safari10`
          );
        }
      }
    });
  },
  /*
   from cmd:
    - linux cp firebase/package.json dist/package.json
    - windows copy firebase\package.json dist\package.json
   */
  "firebase:copy": function(src = ".", dist = "./dist") {
    //fs.copyFileSync(`${src}/package.json`, `${dist}/package.json`);
    let package = JSON.parse(
      fs.readFileSync(`${src}/package.json`, "utf8").toString()
    );
    package.main = package.main.replace("dist/", "");
    fs.writeFileSync(`${dist}/package.json`, JSON.stringify(package));
  },
  transformIndex(path = "./dist/browser/index.html") {
    //DOMParser() is not available in nodejs, so we use `jsdom`
    let content = fs.readFileSync(path, "utf8").toString();
    fs.writeFileSync(path + "bkp", content);

    let dom = new jsDom(content).window.document;
    let mainScript = dom.getElementById("main-script");

    dom.querySelectorAll("script").forEach(script => {
      //todo: or class: keep
      if (!script.src) return;

      let type = script.getAttribute("type");

      //todo: converting <script type="module"> to load() causes a blank page displayed.
      //even if they loaded.
      if (type == "module") return;

      /*
        - nomodule prevents the modern browsers to load the script,
          it instead, will load the "module" version
          https://stackoverflow.com/a/45947601/12577650
       */
      let txt = dom.createTextNode(
        `load("${script.src}","${type || "script"}",{${
          type === "module" ? "" : "nomodule:true,defer:true"
        }});\n`
      );
      mainScript.append(txt);
      script.remove();
      //
    });

    dom.querySelectorAll("link").forEach(el => {
      if (el.rel !== "stylesheet") return;
      let txt = dom.createTextNode(`load("${el.href}","css")`);
      mainScript.append(txt);
      el.remove();
    });

    fs.writeFileSync(path, dom.documentElement.outerHTML);
  }
};

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
