function makeChunk(data, chunkSize) {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    const encodedChunk = Buffer.from(data.slice(i, i + chunkSize)).toString(
      "base64"
    );
    chunks.push(encodedChunk);
  }
  return chunks;
}

module.exports = makeChunk;
