const path = require("path");
const fs = require("fs");
const commander = require("commander");
const packageJson = require("../package.json");
const chalk = require("chalk");

const { encodeFolder, chunkSize } = require("../config.js");
let targetFilePath = null;
let outputFolder = null;

function init() {
  const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .usage(`${chalk.green("<target-file-path> <output-folder>")} [options]`)
    .option("-t, --target <path>", "Target file path")
    .option("-o, --output <folder>", "Output folder")
    .parse(process.argv);

  const args = program.args;
  const options = program.opts();

  targetFilePath = options.target || args[0];
  outputFolder = options.output + `/${encodeFolder}` || args[1] + `/${encodeFolder}`;

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

  const absoluteOutputFolder = path.resolve(outputFolder);
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

  const absoluteFilePath = path.resolve(targetFilePath);
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

init();
