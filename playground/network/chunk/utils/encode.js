const path = require("path");
const fs = require("fs");

const { encodeFolder, readmePath, chunkSize } = require("../config.js");

if (!fs.existsSync(path.resolve(__dirname, `../${encodeFolder}`))) {
  fs.mkdirSync(path.resolve(__dirname, `../${encodeFolder}`));
}

function init() {
  const data = fs.readFileSync(readmePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error occured when read file: ", err);
      return;
    }
  });

  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    const encodedChunk = Buffer.from(data.slice(i, i + chunkSize)).toString("base64");
    chunks.push(encodedChunk);
  }

  chunks.forEach((chunk, index) => {
    fs.writeFile(
      path.resolve(__dirname, path.resolve(__dirname, `../${encodeFolder}`)) + `/chunk-${index + 1}.txt`,
      chunk,
      (err) => {
        if (err) {
          console.error("Error occured when save file: ", err);
          return;
        }
      }
    );
  });
}

init();
