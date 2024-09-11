const path = require("path");
const fs = require("fs");
const { encodeFolder, decodeFolder } = require("../config");

let result = "";
const data = fs.readdirSync(path.resolve(__dirname, `../${encodeFolder}`), "utf8", (err) => {
  if (err) {
    console.error(err);
  }
});

data.forEach((file) => {
  const data = fs.readFileSync(path.resolve(__dirname, `../${encodeFolder}`) + `/${file}`, "utf8", (err) => {
    if (err) {
      console.error("Error occured when read file: ", err);
      return;
    }
  });

  result += Buffer.from(data, "base64").toString("utf8");
});

if (!fs.existsSync(path.resolve(__dirname, `../${decodeFolder}`))) {
  fs.mkdirSync(path.resolve(__dirname, `../${decodeFolder}`));
}

fs.writeFile(path.resolve(__dirname, `../${decodeFolder}/decoded.txt`), result, (err) => {
  if (err) {
    console.error("Error occured when save file: ", err);
    return;
  }
});
