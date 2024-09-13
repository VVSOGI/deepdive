import commander from "commander";
import packageJson from "../package.json";
import chalk from "chalk";
import { CliOptions, EncodeOptions, DecodeOptions } from "./config";
import { Decoder, Encoder } from "./utils";

class CliManager {
  private program: commander.Command;

  constructor() {
    this.program = new commander.Command(packageJson.name)
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
  }

  private runDecode(options: DecodeOptions): void {
    const decoder = new Decoder(options);
    decoder.decode();
  }

  private runEncode(options: EncodeOptions): void {
    const encoder = new Encoder(options);
    encoder.encode();
  }

  public getOptions(): CliOptions {
    return this.program.opts<CliOptions>();
  }

  public execute(options: CliOptions): void {
    if (options.decode) {
      this.runDecode(options);
    } else {
      this.runEncode(options);
    }
  }
}

function init(): void {
  const cliManager = new CliManager();
  const options = cliManager.getOptions();
  cliManager.execute(options);
}

init();
