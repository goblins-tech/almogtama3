const fs = require("fs");
const { execSync } = require("child_process");
const { argv } = require("process");

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
  }
};

const task = argv.slice(2)[0];
if (!task) console.error("enter a task");
else if (!(task in tasks)) console.error(`task ${task} not found`);
else
  try {
    tasks[task](...argv.slice(3));
  } catch (err) {
    err => console.error(`error in task ${task}`, err);
  }