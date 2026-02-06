const fs = require("fs");
const path = require("path");
console.log(1);

const argvs = {};
process.argv.forEach((value) => {
  const i = value.indexOf("=");
  if (i > 0) {
    argvs[value.substring(0, i)] = value.substring(i + 1);
  }
});
const envActive = argvs.env || "prd";
console.log(JSON.stringify(argvs));

const files = fs.readdirSync(path.resolve(__dirname));

for (const file of files) {
    if(file === path.basename(__filename) 
        || path.extname(file) !== ".js"
        || file === "postbuild.js") {
            continue;
    }
    let fileString = fs.readFileSync(path.resolve(__dirname, file), { encoding: "utf8" });
    let replaceFlag = false;
    if(fileString.indexOf("/*env_active*/") > -1) {
        console.log(file);
        replaceFlag = true;
        fileString = fileString.replace(/\/\*env_active\*\//g, envActive);
    }
    if(replaceFlag){
         fs.writeFileSync(path.resolve(__dirname, file), fileString);
    }
}