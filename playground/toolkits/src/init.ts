import { debounce, delay, find, isEqual, maxBy, once } from "es-toolkit/compat";

export function head<T>(arr: readonly [T, ...T[]]): T {
  return arr[0];
}

interface User {
  name: string;
  age: number;
}

console.log(
  maxBy(
    [
      { name: "john", age: 30 },
      { name: "jane", age: 28 },
      { name: "joe", age: 26 },
    ],
    (e) => e.age
  )
);
