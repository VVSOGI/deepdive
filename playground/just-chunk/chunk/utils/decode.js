const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { decodeFolder } = require("../config");

function decode(options) {
  const decodeTargetFolder = path.resolve(options.decode);
  console.log(chalk.cyan(`Start decoding files in ${decodeTargetFolder}`));
  const regTxt = /^.+\.txt$/i;
  let result = "";
  const data = fs.readdirSync(decodeTargetFolder, "utf8", (err) => {
    if (err) {
      console.error(err);
    }
  });

  data.forEach((file) => {
    if (!regTxt.test(file)) {
      return;
    }

    const data = fs.readFileSync(decodeTargetFolder + `/${file}`, "utf8", (err) => {
      if (err) {
        console.error("Error occured when read file: ", err);
        return;
      }
    });

    result += Buffer.from(data, "base64").toString("utf8");
  });

  if (!fs.existsSync(path.resolve(decodeTargetFolder, `./${decodeFolder}`))) {
    fs.mkdirSync(path.resolve(decodeTargetFolder, `./${decodeFolder}`));
  }

  fs.writeFile(path.resolve(decodeTargetFolder, `${decodeTargetFolder}/${decodeFolder}/decoded.txt`), result, (err) => {
    if (err) {
      console.error("Error occured when save file: ", err);
      return;
    }
  });
  console.log(chalk.cyan(`Complete decoding files in ${`${decodeTargetFolder}/${decodeFolder}/decoded.txt`}`));
}

module.exports = decode;
