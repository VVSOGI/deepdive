const path = require("path");
const fs = require("fs");
const save = require("./utils/save.js");
const readFile = require("./utils/readfile.js");

const { outputDir, readmePath, chunkSize } = require("./config.js");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function init() {
  const data = await readFile(readmePath);
  const chunksFolder = path.resolve(__dirname, outputDir);
  save(data, chunkSize, chunksFolder);
}

init();
