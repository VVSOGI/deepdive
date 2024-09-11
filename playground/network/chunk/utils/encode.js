const path = require("path");
const fs = require("fs");
const commander = require("commander");
const packageJson = require("../package.json");
const chalk = require("chalk");

const { encodeFolder, chunkSize } = require("../config.js");
let targetFilePath = null;

if (!fs.existsSync(path.resolve(__dirname, `../${encodeFolder}`))) {
  fs.mkdirSync(path.resolve(__dirname, `../${encodeFolder}`));
}

function init() {
  const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .arguments("<target-file-path>")
    .action((target) => {
      targetFilePath = target;
    })
    .allowUnknownOption()
    .parse(process.argv);

  if (targetFilePath === null) {
    console.log(chalk.red("No target file path specified"));
    console.log(chalk.red("Usage: node encode.js <target-file-path>"));
    process.exit(1);
  }

  const absolutePath = path.resolve(targetFilePath);
  console.log(chalk.cyan(`Check exists ${absolutePath}`));
  if (fs.existsSync(absolutePath)) {
    console.log(chalk.green(`File ${targetFilePath} found at ${absolutePath}`));
    console.log(chalk.cyan(`[ Start ] ${absolutePath} encoding...`));

    const data = fs.readFileSync(absolutePath, "utf8", (err, data) => {
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

    console.log(chalk.cyan(`[ Success ] File ${absolutePath} encoded successfully!`));
  } else {
    console.log(chalk.red(`File ${targetFilePath} not found at ${absolutePath}`));
    console.log(chalk.red("Please check a file path and try again"));
    process.exit(1);
  }
}

init();
