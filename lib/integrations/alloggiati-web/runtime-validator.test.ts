import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createRuntimeAlloggiatiWebValidator,
} from "./runtime-validator";

describe(
  "createRuntimeAlloggiatiWebValidator",
  () => {
    it(
      "crea il validator runtime",
      () => {
        const validator =
          createRuntimeAlloggiatiWebValidator({
            username: "test-user",
            password: "test-password",
            wsKey: "test-wskey",
          });

        expect(
          validator.validateSubmission,
        ).toBeTypeOf("function");

        expect(
          validator.submit,
        ).toBeTypeOf("function");
      },
    );

    it(
      "rifiuta credenziali vuote",
      () => {
        expect(() =>
          createRuntimeAlloggiatiWebValidator({
            username: "",
            password: "test-password",
            wsKey: "test-wskey",
          }),
        ).toThrow(
          "Username Alloggiati Web obbligatorio.",
        );
      },
    );
  },
);
