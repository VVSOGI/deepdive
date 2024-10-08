{
  const people = [
    { id: 1, name: "joe" },
    { id: 2, name: "alice" },
  ] as const;

  type Extract<T extends readonly any[]> = T[number];
  type People = Extract<typeof people>;
  type Widen<T> = T extends number ? number : T extends string ? string : T;
  type PeopleOriginalType = {
    -readonly [P in keyof People]: Widen<People[P]>;
  };
  type PeopleNames = People["name"];

  const list: Record<PeopleNames, PeopleOriginalType> = {
    joe: people[0],
    alice: people[1],
  };

  const sym = Symbol();
  const list2: Record<symbol, { id: number; name: string }[]> = {
    [sym]: [{ id: 1, name: "123" }],
  };
}
