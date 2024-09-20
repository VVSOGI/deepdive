"use strict";
(() => {
  // output/something/check.ts
  var check = /* @__PURE__ */ (() => {
    const $io0 = (input) =>
      "string" === typeof input.id &&
      /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(input.id) &&
      "string" === typeof input.email &&
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(
        input.email
      ) &&
      "number" === typeof input.age &&
      Math.floor(input.age) === input.age &&
      0 <= input.age &&
      input.age <= 4294967295 &&
      19 < input.age &&
      input.age <= 100;
    return (input) => "object" === typeof input && null !== input && $io0(input);
  })();
  check({
    id: "eef46580-5ea1-4ab3-a9be-329f6a793deb",
    email: "email@email.eam",
    age: 20,
  });
})();
