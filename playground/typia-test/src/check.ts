import typia, { tags } from "typia";

export const check: (input: IMember) => input is IMember = typia.createIs<IMember>();

interface IMember {
  id: string & tags.Format<"uuid">;
  email: string & tags.Format<"email">;
  age: number & tags.Type<"uint32"> & tags.ExclusiveMinimum<19> & tags.Maximum<100>;
}

check({
  id: "eef46580-5ea1-4ab3-a9be-329f6a793deb",
  email: "email@email.eam",
  age: 20,
});
