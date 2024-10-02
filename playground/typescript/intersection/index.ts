interface Animal {
  walk(): string;
}

interface Bear extends Animal {
  roar(): string;
}

type SameAnimal = {
  walk(): string;
};

type SameBear = SameAnimal & {
  roar(): string;
};
