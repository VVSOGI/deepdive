{
  interface Person {
    name: string;
    age: number;
    message: string;
  }

  interface Animal {
    name: string;
    age: number;
    family: string;
  }

  type PartialMimic<T> = { [P in keyof T]?: T[P] | undefined };

  function update<T>(target: T, update: PartialMimic<T>): T {
    return { ...target, ...update };
  }

  const person: Person = {
    name: "john",
    age: 20,
    message: "Hello World!",
  };

  const animal: Animal = {
    name: "Chirs P bacon",
    age: 3,
    family: "John",
  };

  update<Person>(person, {
    name: "doe",
  });

  update<Animal>(animal, {
    family: "Alice",
  });
}
