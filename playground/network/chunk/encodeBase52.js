function encodeBase52(input) {
  const buffer = Buffer.from(input, "utf-8");
  let result = "";
  let number = BigInt("0x" + buffer.toString("hex"));

  while (number > 0) {
    result = BASE52_CHARS[number % 52n] + result;
    number = number / 52n;
  }

  return result || BASE52_CHARS[0];
}
