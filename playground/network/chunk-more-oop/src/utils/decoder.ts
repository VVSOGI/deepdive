import path, { resolve } from "path";
import fs from "fs";
import chalk from "chalk";
import { decodeFolder, DecodeOptions } from "../config";

export class Decoder {
  private decodeTargetFolder: string;

  constructor(options: DecodeOptions) {
    this.decodeTargetFolder = resolve(options.decode);
  }

  private ensureDecodeFolderExists(): void {
    if (!fs.existsSync(this.decodeTargetFolder)) {
      console.log(chalk.red(`Folder ${this.decodeTargetFolder} does not exist`));
      console.log(chalk.red("Please check the folder path and try again"));
      process.exit(1);
    }
  }

  private getChunkFiles(): string[] {
    const data = fs.readdirSync(this.decodeTargetFolder, {
      encoding: "utf8",
    });

    return data;
  }

  private decodeChunk(chunk: string[]): string {
    console.log(chalk.cyan(`Start decoding files in ${this.decodeTargetFolder}`));
    const regTxt = /^.+\.txt$/i;

    let result = "";
    chunk.forEach((file) => {
      if (!regTxt.test(file)) {
        return;
      }
      const data = fs.readFileSync(this.decodeTargetFolder + `/${file}`, {
        encoding: "utf8",
      });

      result += Buffer.from(data, "base64").toString("utf8");
    });

    return result;
  }

  private saveDecodedFile(decoded: string): void {
    if (!fs.existsSync(path.resolve(this.decodeTargetFolder, `./${decodeFolder}`))) {
      fs.mkdirSync(path.resolve(this.decodeTargetFolder, `./${decodeFolder}`));
    }

    fs.writeFile(
      path.resolve(this.decodeTargetFolder, `${this.decodeTargetFolder}/${decodeFolder}/decoded.txt`),
      decoded,
      (err) => {
        if (err) {
          console.error("Error occured when save file: ", err);
          return;
        }
      }
    );

    console.log(chalk.cyan(`Complete decoding files in ${`${this.decodeTargetFolder}/${decodeFolder}/decoded.txt`}`));
  }

  public decode() {
    this.ensureDecodeFolderExists();
    const chunks = this.getChunkFiles();
    const decoded = this.decodeChunk(chunks);
    this.saveDecodedFile(decoded);
  }
}
