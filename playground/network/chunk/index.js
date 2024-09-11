const commander = require("commander");
const packageJson = require("./package.json");
const chalk = require("chalk");
const decode = require("./utils/decode.js");
const encode = require("./utils/encode.js");

function init() {
  const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .usage(`${chalk.green("<target-file-path> <output-folder> <target-folder>")} [options]`)
    .option("-t, --target <path>", "Target file path")
    .option("-o, --output <folder>", "Output folder")
    .option("-d --decode <target-folder>", "Decode target folder")
    .parse(process.argv);

  const options = program.opts();

  if (options.decode) {
    return decode(options);
  }

  return encode(options);
}

init();
