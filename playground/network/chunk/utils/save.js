const fs = require("fs");

async function save(data, chunkSize, path) {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    const encodedChunk = Buffer.from(data.slice(i, i + chunkSize)).toString(
      "base64"
    );
    chunks.push(encodedChunk);
  }

  chunks.forEach((chunk, index) => {
    fs.writeFile(`${path}/chunk-${index + 1}.txt`, chunk, (err) => {
      if (err) {
        console.error("Error occured when save file: ", err);
        return;
      }
    });
  });
}

module.exports = save;
