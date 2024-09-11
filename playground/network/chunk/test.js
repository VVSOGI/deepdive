const path = require("path");
const fs = require("fs");

fs.readdir(path.resolve(__dirname, `chunks`), "utf8", (err, data) => {
  if (err) {
    console.error(err);
  }
  console.log(data);
});

// console.log(Buffer.from(data, "base64").toString("utf8"));
