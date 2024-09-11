const path = require("path");
const fs = require("fs");
const save = require("./utils/save.js");

const { outputDir, readmePath, chunkSize } = require("./config.js");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

function init() {
  const data = fs.readFileSync(readmePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error occured when read file: ", err);
      return;
    }
  });
  const chunksFolder = path.resolve(__dirname, outputDir);
  save(data, chunkSize, chunksFolder);
}

init();
