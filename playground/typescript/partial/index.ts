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

  type PartialMimic<T> = { [P in keyof T]?: T[P] };

  type UpdateProps<T> = {
    [K in keyof T]?: undefined extends T[K] ? T[K] : Exclude<T[K], undefined>;
  };

  const person: Person = {
    name: "john",
    age: 20,
    message: "Hello World!",
  };

  const animal: Animal = {
    name: "Chirs P. bacon",
    age: 3,
    family: "John",
  };

  function update<T>(target: T, update: PartialMimic<T>): T {
    return { ...target, ...update };
  }

  function safeUpdate<T>(obj: T, props: UpdateProps<T>): T {
    return { ...obj, ...props };
  }

  function checkedUpdate<T>(obj: T, props: Partial<T>): T {
    const result = { ...obj };
    for (const key in props) {
      if (props[key] !== undefined) {
        (result as any)[key] = props[key];
      }
    }
    return result;
  }

  const updated1 = update<Animal>(animal, {
    family: "Alice",
  });

  const updated2 = safeUpdate<Person>(person, {
    name: undefined,
  });

  const updated3 = checkedUpdate(person, { name: "Jane", age: undefined });

  // 여기서 typia로 좀 더 명시적인 검사 작성하면 좋을 듯.
}
