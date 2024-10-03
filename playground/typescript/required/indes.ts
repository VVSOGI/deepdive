{
  interface Props {
    a?: number;
    b?: string;
  }

  type RequiredMimic<T> = {
    [Property in keyof T as Property extends string ? `mimic${Capitalize<Property>}` : never]-?: T[Property];
  };

  const obj: Props = { a: 5 };

  const obj2: RequiredMimic<Props> = { mimicA: 5, mimicB: "10" };
}
