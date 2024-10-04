{
  interface Props {
    a?: number;
    b?: string;
  }

  type RequiredMimic<T> = {
    [Property in keyof T as `mimic${Capitalize<string & Property>}`]-?: T[Property];
  };

  const obj: Props = { a: 5 };

  const obj2: RequiredMimic<Props> = { mimicA: 5, mimicB: "10" };
}
