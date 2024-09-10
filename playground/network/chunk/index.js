const fs = require("fs");
const path = require("path");
const makeChunk = require("./utils/makeChunk.js");

const readmePath = "README.md";
const chunkSize = 500;
const outputDir = "chunks";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.readFile(readmePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error occured when read file: ", err);
    return;
  }
  const chunks = makeChunk(data, chunkSize);
});
