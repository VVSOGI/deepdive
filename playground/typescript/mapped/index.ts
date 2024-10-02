type CreateMutable<Type> = {
  -readonly [Property in keyof Type]: Type[Property];
};

type LockedAccount = {
  readonly id: string;
  readonly name?: string;
};

type UnlockedAccount = CreateMutable<LockedAccount>;

type Getters<Type> = {
  [Property in keyof Type as `get${Capitalize<string & Property>}`]: () => Type[Property];
};

// 너무 놀랍다..

interface Person {
  name: string;
  age: number;
  location: string;
}

type LazyPerson = Getters<Person>;

interface LazyPerson2 {
  getName(): string;
  getAge(): number;
  getLocation(): string;
}

class person implements LazyPerson {
  getName() {
    return "name";
  }

  getAge() {
    return 10;
  }

  getLocation() {
    return "se";
  }
}
function filter<T>(arr: readonly T[], doesMatch: { [K in keyof T]?: T[K] }): T[] {
  return [...arr];
}

const arr = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];
filter(arr, { name: "Bob" });
