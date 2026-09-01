import {
  randomBytes,
} from "node:crypto";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  decryptCredential,
  encryptCredential,
} from "./credential-crypto";

function createKey(): string {
  return randomBytes(32).toString("base64");
}

describe("credential crypto", () => {
  it(
    "cifra e decifra una credenziale",
    () => {
      const key = createKey();

      const encrypted =
        encryptCredential(
          "secret-value",
          key,
        );

      expect(encrypted).not.toContain(
        "secret-value",
      );

      expect(
        decryptCredential(
          encrypted,
          key,
        ),
      ).toBe("secret-value");
    },
  );

  it(
    "usa un IV diverso a ogni cifratura",
    () => {
      const key = createKey();

      const first =
        encryptCredential(
          "secret-value",
          key,
        );

      const second =
        encryptCredential(
          "secret-value",
          key,
        );

      expect(first).not.toBe(second);
    },
  );

  it(
    "rifiuta una chiave errata",
    () => {
      const encrypted =
        encryptCredential(
          "secret-value",
          createKey(),
        );

      expect(() =>
        decryptCredential(
          encrypted,
          createKey(),
        ),
      ).toThrow();
    },
  );

  it(
    "rifiuta ciphertext alterato",
    () => {
      const key = createKey();

      const encrypted =
        encryptCredential(
          "secret-value",
          key,
        );

      const parts = encrypted.split(".");
      parts[3] =
        Buffer.from("altered")
          .toString("base64");

      expect(() =>
        decryptCredential(
          parts.join("."),
          key,
        ),
      ).toThrow();
    },
  );

  it(
    "rifiuta chiavi di dimensione errata",
    () => {
      const invalidKey =
        randomBytes(16).toString("base64");

      expect(() =>
        encryptCredential(
          "secret-value",
          invalidKey,
        ),
      ).toThrow(
        "La chiave di cifratura credenziali deve essere di 32 byte.",
      );
    },
  );
});
