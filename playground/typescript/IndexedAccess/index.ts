{
  type Person = { age: number; name: string; alive: boolean };
  type Age = Person["age"];

  type Loop = Person[keyof Person];

  const MyArray = [
    { name: "Alice", age: 15 },
    { name: "Bob", age: 23 },
    { name: "Eve", age: 38 },
  ];

  type ArrayPerson = {
    [Property in keyof (typeof MyArray)[number] as `get${Capitalize<Property>}`]: () => void;
  };
}
