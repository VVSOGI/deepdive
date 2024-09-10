const fs = require("fs");
const path = require("path");
const readmePath = "README.md";
const chunkSize = 200;
const outputDir = "chunks";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.readFile(readmePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error occured when read file: ", err);
    return;
  }

  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    const test = encodeBase52(data.slice(i, i + chunkSize));
    console.log(test);
    chunks.push(data.slice(i, i + chunkSize));
  }

  chunks.forEach((chunk, index) => {
    const fileName = `chunk_${index + 1}.md`;
    const filePath = path.join(outputDir, fileName);
  });
});
