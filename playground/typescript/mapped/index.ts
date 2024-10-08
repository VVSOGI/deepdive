{
  type CreateMutable<T> = {
    -readonly [P in keyof T]: T[P];
  };

  type LockedAccount = {
    readonly id: string;
    readonly name?: string;
  };

  type UnlockedAccount = CreateMutable<LockedAccount>;

  type Getters<T> = {
    [P in keyof T as `get${Capitalize<string & P>}`]: () => T[P];
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

  type Man = {
    id: number;
    name: string;
    age: number;
    message?: string;
  };

  type Concrete<T> = {
    [property in keyof T]-?: T[property];
  };

  type User = Concrete<Man>;

  const man: User = {
    id: 1,
    name: "doe",
    age: 25,
    message: "hello world!",
  };

  type EventConfig<Events extends { kind: string }> = {
    [E in Events as E["kind"]]: (event: E) => void;
  };

  type SquareEvent = { kind: "square"; x: number; y: number };
  type CircleEvent = { kind: "circle"; radius: number };

  type Config = EventConfig<SquareEvent | CircleEvent>;
}
