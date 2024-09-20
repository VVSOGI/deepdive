import typia, { tags } from "typia";

export const check = typia.createIs<IMember>();

interface IMember {
  id: string & tags.Format<"uuid">;
  email: string & tags.Format<"email">;
  age: number & tags.ExclusiveMinimum<19> & tags.Maximum<100>;
}

console.log(
  check({
    id: "eef46580-5ea1-4ab3-a9be-329f6a793deb",
    email: "test@tset.com",
    age: 20,
  })
);
