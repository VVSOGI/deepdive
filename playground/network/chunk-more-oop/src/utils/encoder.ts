import path from "path";
import fs from "fs";
import chalk from "chalk";
import { BaseOptions, chunkSize, encodeFolder } from "../config";

export class Encoder {
  private options: BaseOptions;
  private targetFilePath: string;
  private outputFolder: string;
  private absoluteOutputFolder: string;
  private absoluteFilePath: string;

  constructor(options: BaseOptions) {
    this.options = options;
    this.targetFilePath = options.target;
    this.outputFolder = options.output + `/${encodeFolder}`;
    this.absoluteOutputFolder = path.resolve(this.outputFolder);
    this.absoluteFilePath = path.resolve(this.targetFilePath);
  }

  private validateInputs(): void {
    if (!this.targetFilePath) {
      console.log(chalk.red("No target file path specified"));
      console.log(chalk.red("Usage: node encode.js <target-file-path> <output-folder>"));
      process.exit(1);
    }

    if (!this.outputFolder) {
      console.log(chalk.red("No output folder specified"));
      console.log(chalk.red("Usage: node encode.js <target-file-path> <output-folder>"));
      process.exit(1);
    }
  }

  private ensureOutputFolderExists(): void {
    console.log(chalk.cyan(`Check exists ${this.absoluteOutputFolder}`));
    if (!fs.existsSync(this.absoluteOutputFolder)) {
      try {
        console.log(chalk.cyan(`Create a folder ${this.absoluteOutputFolder}`));
        fs.mkdirSync(this.absoluteOutputFolder);
      } catch (err) {
        if (err.code === "EACCES") {
          console.log(chalk.red(`Permission denied for creating directory in ${this.options.output}`));
          console.log(chalk.red("Please check a folder permission and try again"));
          process.exit(1);
        }
      }
    }
    console.log(chalk.green(`Complete to create a folder ${this.absoluteOutputFolder}`));
  }

  private encodeFile(): void {
    console.log(chalk.cyan(`Check exists ${this.absoluteFilePath}`));
    if (fs.existsSync(this.absoluteFilePath)) {
      console.log(chalk.green(`File ${this.targetFilePath} found at ${this.absoluteFilePath}`));
      console.log(chalk.cyan(`[ Start ] ${this.absoluteFilePath} encoding...`));

      const data = fs.readFileSync(this.absoluteFilePath, { encoding: "utf8" });

      const chunks = [];
      for (let i = 0; i < data.length; i += chunkSize) {
        const encodedChunk = Buffer.from(data.slice(i, i + chunkSize)).toString("base64");
        chunks.push(encodedChunk);
      }

      chunks.forEach((chunk, index) => {
        fs.writeFile(
          path.resolve(__dirname, path.resolve(this.absoluteOutputFolder)) + `/chunk-${index + 1}.txt`,
          chunk,
          (err) => {
            if (err) {
              console.error("Error occurred when save file: ", err);
              return;
            }
          }
        );
      });

      console.log(chalk.cyan(`[ Success ] File ${this.absoluteFilePath} encoded successfully!`));
    } else {
      console.log(chalk.red(`File ${this.targetFilePath} not found at ${this.absoluteFilePath}`));
      console.log(chalk.red("Please check a file path and try again"));
      process.exit(1);
    }
  }

  public encode(): void {
    this.validateInputs();
    this.ensureOutputFolderExists();
    this.encodeFile();
  }
}
