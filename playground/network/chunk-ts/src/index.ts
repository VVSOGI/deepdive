import commander from "commander";
import packageJson from "../package.json";
import chalk from "chalk";

function init() {
  const program = new commander.Command(packageJson.name)
    .version(packageJson.version)
    .usage(
      `
      node index.js -t ${chalk.green("<target-file-path>")} -o ${chalk.green("<output-folder>")}
      node index.js -d ${chalk.green("<target-folder>")}
      `
    )
    .option("-t, --target <path>", "Target file path")
    .option("-o, --output <folder>", "Output folder")
    .option("-d --decode <target-folder>", "Decode target folder")
    .parse(process.argv);

  const options = program.opts<{ target: string; output: string; decode: string }>();

  //   if (options.decode) {
  //     return decode(options);
  //   }

  //   return encode(options);
}

init();
