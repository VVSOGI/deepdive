type Props = string | number;

function foo(x: Props) {
  //   return Math.floor(x); error
  //   recommand
  if (typeof x === "string") {
    return x;
  }
  return Math.ceil(x);
}
