{
  interface Todo {
    title: string;
    kind: string;
  }

  type MimicReadonly<T> = {
    readonly [Property in keyof T as Property extends "kind" ? never : Property]: T[Property];
  } & (T extends { kind: any } ? Pick<T, "kind"> : {});

  const todo: MimicReadonly<Todo> = {
    title: "Delete inactive users",
    kind: "something",
  };

  //   todo.title = "123"; <- can't assign
  todo.kind = "20"; // <- ok because custom type Readonly
}
