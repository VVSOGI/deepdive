import path from "path";
import fs from "fs";
import commander from "commander";
import chalk from "chalk";

interface CliOptions {
  source: string;
  destination: string;
  limit: number;
}

class FileTransfer {
  private sourceFile: string;
  private destFile: string;
  private chunkSize: number;
  private bytesTransferred: number;
  private fileSize: number;
  private readStream: fs.ReadStream;
  private writeStream: fs.WriteStream;

  constructor(options: CliOptions) {
    this.sourceFile = path.resolve(options.source);
    this.destFile = path.resolve(options.destination, path.basename(options.source));
    this.chunkSize = options.limit * 1024;
    this.bytesTransferred = 0;
    this.fileSize = 0;
  }

  private setupEventListeners(): void {
    this.readStream.on("error", (err) => {
      console.error("Error reading file:", err);
    });

    this.writeStream.on("error", (err) => {
      console.log(chalk.red("Error writing file:", err));
    });

    this.readStream.on("end", () => {
      if (this.bytesTransferred < this.fileSize) {
        console.log(chalk.yellow("Stream ended before file was fully transferred"));
      }
    });
  }

  private transfer(): void {
    let chunk = this.readStream.read(this.chunkSize);

    if (chunk === null) {
      this.readStream.once("readable", () => this.transfer());
      return;
    }

    this.writeStream.write(chunk, (err) => {
      if (err) {
        console.error("Error writing to file:", err);
        this.readStream.destroy();
        return;
      }

      this.bytesTransferred += chunk.length;
      console.log(`Transferred: ${this.bytesTransferred} / ${this.fileSize} bytes`);

      if (this.bytesTransferred >= this.fileSize) {
        console.log(chalk.cyan(`File transferred successfully to ${this.destFile}`));
        this.writeStream.end();
        return;
      }

      setTimeout(() => this.transfer(), 1000); // Wait for 1 second before next chunk
    });
  }

  public start(): void {
    if (!fs.existsSync(this.sourceFile)) {
      console.log(chalk.red(`Source file ${this.sourceFile} does not exist.`));
      return;
    }

    this.fileSize = fs.statSync(this.sourceFile).size;
    this.readStream = fs.createReadStream(this.sourceFile);
    this.writeStream = fs.createWriteStream(this.destFile);

    this.setupEventListeners();
    this.transfer();
  }
}

class CLI {
  private program: commander.Command;

  constructor() {
    this.program = new commander.Command();
    this.setupProgram();
  }

  private setupProgram(): void {
    this.program
      .version("1.0.0")
      .description("File transfer CLI with speed limit")
      .option("-s, --source <path>", "Source file path")
      .option("-d, --destination <path>", "Destination folder path")
      .option("-l, --limit <speed>", "Speed limit in KB/s", parseInt)
      .parse(process.argv);
  }

  public runTransfer(): void {
    const options = this.program.opts<CliOptions>();

    if (!options.source || !options.destination || !options.limit) {
      console.log(chalk.red("Please provide all required options: source, destination, and limit"));
      console.log(chalk.yellow("Example: node init.js -s <source> -d <destination> -l <speed [Speed limit in KB/s]>"));
      return;
    }

    const transfer = new FileTransfer(options);
    transfer.start();
  }
}

function init() {
  const cli = new CLI();
  cli.runTransfer();
}

init();
