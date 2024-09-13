const fs = require("fs");
const path = require("path");
const commander = require("commander");
const chalk = require("chalk");

function transferWithSpeedLimit(options) {
  const { source, destination, speed } = options;
  const sourceFile = path.resolve(source);
  const destFile = path.resolve(destination, path.basename(source));

  if (!fs.existsSync(sourceFile)) {
    console.error(`Source file ${sourceFile} does not exist.`);
    return;
  }

  const readStream = fs.createReadStream(sourceFile);
  const writeStream = fs.createWriteStream(destFile);

  const chunkSize = speed * 1024;
  let bytesTransferred = 0;
  const fileSize = fs.statSync(sourceFile).size;

  function transfer() {
    let chunk = readStream.read(chunkSize);

    if (chunk === null) {
      readStream.once("readable", transfer);
      return;
    }

    writeStream.write(chunk, (err) => {
      if (err) {
        console.error("Error writing to file:", err);
        readStream.destroy();
        return;
      }

      bytesTransferred += chunk.length;
      console.log(`Transferred: ${bytesTransferred} / ${fileSize} bytes`);

      if (bytesTransferred >= fileSize) {
        console.log(`File transferred successfully to ${destFile}`);
        writeStream.end();
        return;
      }

      setTimeout(transfer, 1000); // Wait for 1 second before next chunk
    });
  }

  readStream.on("error", (err) => {
    console.error("Error reading file:", err);
  });

  writeStream.on("error", (err) => {
    console.error("Error writing file:", err);
  });

  readStream.on("end", () => {
    if (bytesTransferred < fileSize) {
      console.error("Stream ended before file was fully transferred");
    }
  });

  transfer(); // Start the transfer process
}

function init() {
  const program = new commander.Command()
    .version("1.0.0")
    .description("File transfer CLI with speed limit")
    .option("-s, --source <path>", "Source file path")
    .option("-d, --destination <path>", "Destination folder path")
    .option("-l, --limit <speed>", "Speed limit in KB/s", parseInt)
    .parse(process.argv);

  const options = program.opts();

  if (!options.source || !options.destination || !options.limit) {
    console.log(chalk.red("Please provide all required options: source, destination, and limit"));
    console.log(chalk.yellow("Example: node init.js -s <source> -d <destination> -l <speed [Speed limit in KB/s]>"));
    return;
  }

  transferWithSpeedLimit({
    source: options.source,
    destination: options.destination,
    speed: options.limit,
  });
}

init();
