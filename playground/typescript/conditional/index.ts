interface Animal {
  walk(): string;
}

interface Bear extends Animal {
  roar(): string;
}

type Example1 = Bear extends Animal ? number : string;
type Example2 = RegExp extends Animal ? number : string;

const example1: Example1 = 10;
const example2: Example2 = "10";

interface IdLabel {
  id: number;
}

interface NameLabel {
  name: string;
}

type NameOrId<T extends number | string> = T extends number ? IdLabel : NameLabel;

function createLabel<T extends number | string>(props: T): NameOrId<T> {
  if (typeof props === "number") {
    return { id: props } as NameOrId<T>;
  } else {
    return { name: props } as NameOrId<T>;
  }
}

type MessageOf<T> = T extends { message: unknown } ? T["message"] : never;

interface Email {
  message: string;
}

interface Num {
  message: number;
}

interface Dog {
  bark(): string;
}

type EmailMessageContents = MessageOf<Email>;
// string
type NumMessageContents = MessageOf<Num>;
// number
type DogMessageContents = MessageOf<Dog>;

type Test<T extends any[]> = T[number];

type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;

type Str = Flatten<{ id: number; name: string }[]>;
