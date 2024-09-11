const fs = require("fs");

async function readFile(path) {
  return await new Promise((resolve, reject) => {
    fs.readFile(path, "utf8", (err, data) => {
      if (err) {
        console.error("Error occured when read file: ", err);
        return;
      }
      resolve(data);
    });
  });
}

module.exports = readFile;
