import {
  randomBytes,
} from "node:crypto";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  decryptDocument,
  encryptDocument,
} from "./document-crypto";

function createKey(): string {
  return randomBytes(32).toString("base64");
}

function createDocument(): Uint8Array {
  return Buffer.from(
    "%PDF-1.7\\nHorizon secure document\\n",
    "utf8",
  );
}

describe("document crypto", () => {
  it(
    "cifra e decifra un documento binario",
    () => {
      const key = createKey();
      const document = createDocument();

      const encrypted =
        encryptDocument(document, key);

      expect(
        Buffer.from(encrypted).equals(
          Buffer.from(document),
        ),
      ).toBe(false);

      expect(
        Buffer.from(
          decryptDocument(encrypted, key),
        ).equals(Buffer.from(document)),
      ).toBe(true);
    },
  );

  it(
    "usa un IV diverso a ogni cifratura",
    () => {
      const key = createKey();
      const document = createDocument();

      const first =
        encryptDocument(document, key);
      const second =
        encryptDocument(document, key);

      expect(
        Buffer.from(first).equals(
          Buffer.from(second),
        ),
      ).toBe(false);
    },
  );

  it(
    "rifiuta una chiave errata",
    () => {
      const encrypted =
        encryptDocument(
          createDocument(),
          createKey(),
        );

      expect(() =>
        decryptDocument(
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
      const encrypted = Buffer.from(
        encryptDocument(
          createDocument(),
          key,
        ),
      );

      encrypted[encrypted.length - 1] ^= 1;

      expect(() =>
        decryptDocument(
          encrypted,
          key,
        ),
      ).toThrow();
    },
  );

  it(
    "rifiuta versioni non supportate",
    () => {
      const key = createKey();
      const encrypted = Buffer.from(
        encryptDocument(
          createDocument(),
          key,
        ),
      );

      encrypted[5] = 2;

      expect(() =>
        decryptDocument(
          encrypted,
          key,
        ),
      ).toThrow(
        "Versione documento cifrato non supportata: 2.",
      );
    },
  );

  it(
    "rifiuta chiavi di dimensione errata",
    () => {
      const invalidKey =
        randomBytes(16).toString("base64");

      expect(() =>
        encryptDocument(
          createDocument(),
          invalidKey,
        ),
      ).toThrow(
        "La chiave di cifratura documenti deve essere di 32 byte.",
      );
    },
  );

  it(
    "rifiuta documenti vuoti",
    () => {
      expect(() =>
        encryptDocument(
          new Uint8Array(),
          createKey(),
        ),
      ).toThrow(
        "Il documento da cifrare è vuoto.",
      );
    },
  );
});
