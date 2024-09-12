import path from "path";
import fs from "fs";
import chalk from "chalk";
import { decodeFolder, DecodeOptions } from "../config";

export function decode(options: DecodeOptions) {
  const decodeTargetFolder = path.resolve(options.decode);
  console.log(chalk.cyan(`Start decoding files in ${decodeTargetFolder}`));
  const regTxt = /^.+\.txt$/i;
  let result = "";
  const data = fs.readdirSync(decodeTargetFolder, {
    encoding: "utf8",
  });

  data.forEach((file) => {
    if (!regTxt.test(file)) {
      return;
    }

    const data = fs.readFileSync(decodeTargetFolder + `/${file}`, {
      encoding: "utf8",
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
