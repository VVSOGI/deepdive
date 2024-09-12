const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { encodeFolder, chunkSize } = require("../config.js");

function encode(options) {
  const targetFilePath = options.target;
  const outputFolder = options.output + `/${encodeFolder}`;
  const absoluteOutputFolder = path.resolve(outputFolder);
  const absoluteFilePath = path.resolve(targetFilePath);

  if (!targetFilePath) {
    console.log(chalk.red("No target file path specified"));
    console.log(chalk.red("Usage: node encode.js <target-file-path> <output-folder>"));
    process.exit(1);
  }

  if (!outputFolder) {
    console.log(chalk.red("No output folder specified"));
    console.log(chalk.red("Usage: node encode.js <target-file-path> <output-folder>"));
    process.exit(1);
  }

  console.log(chalk.cyan(`Check exists ${absoluteOutputFolder}`));
  if (!fs.existsSync(absoluteOutputFolder)) {
    try {
      console.log(chalk.cyan(`Create a folder ${absoluteOutputFolder}`));
      fs.mkdirSync(absoluteOutputFolder);
    } catch (err) {
      if (err.code === "EACCES") {
        console.log(chalk.red(`Permission denied for creating directory in ${options.output}`));
        console.log(chalk.red("Please check a folder permission and try again"));
        process.exit(1);
      }
    }
  }
  console.log(chalk.green(`Complete to create a folder ${absoluteOutputFolder}`));

  console.log(chalk.cyan(`Check exists ${absoluteFilePath}`));
  if (fs.existsSync(absoluteFilePath)) {
    console.log(chalk.green(`File ${targetFilePath} found at ${absoluteFilePath}`));
    console.log(chalk.cyan(`[ Start ] ${absoluteFilePath} encoding...`));

    const data = fs.readFileSync(absoluteFilePath, "utf8", (err, data) => {
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
        path.resolve(__dirname, path.resolve(absoluteOutputFolder)) + `/chunk-${index + 1}.txt`,
        chunk,
        (err) => {
          if (err) {
            console.error("Error occured when save file: ", err);
            return;
          }
        }
      );
    });

    console.log(chalk.cyan(`[ Success ] File ${absoluteFilePath} encoded successfully!`));
  } else {
    console.log(chalk.red(`File ${targetFilePath} not found at ${absoluteFilePath}`));
    console.log(chalk.red("Please check a file path and try again"));
    process.exit(1);
  }
}

module.exports = encode;
