import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;
const VERSION = "v1";

export type EncryptedCredential = string;

export function encryptCredential(
  plaintext: string,
  keyBase64: string,
): EncryptedCredential {
  if (!plaintext) {
    throw new Error(
      "La credenziale da cifrare è vuota.",
    );
  }

  const key = decodeKey(keyBase64);
  const iv = randomBytes(IV_BYTES);

  const cipher = createCipheriv(
    ALGORITHM,
    key,
    iv,
  );

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decryptCredential(
  encrypted: EncryptedCredential,
  keyBase64: string,
): string {
  const parts = encrypted.split(".");

  if (
    parts.length !== 4 ||
    parts[0] !== VERSION
  ) {
    throw new Error(
      "Formato credenziale cifrata non valido.",
    );
  }

  const [, ivBase64, tagBase64, ciphertextBase64] =
    parts;

  const key = decodeKey(keyBase64);
  const iv = Buffer.from(ivBase64, "base64");
  const tag = Buffer.from(tagBase64, "base64");
  const ciphertext = Buffer.from(
    ciphertextBase64,
    "base64",
  );

  if (iv.length !== IV_BYTES) {
    throw new Error(
      "IV credenziale cifrata non valido.",
    );
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    iv,
  );

  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return plaintext.toString("utf8");
}

function decodeKey(
  keyBase64: string,
): Buffer {
  if (!keyBase64.trim()) {
    throw new Error(
      "Chiave di cifratura credenziali non configurata.",
    );
  }

  const key = Buffer.from(
    keyBase64,
    "base64",
  );

  if (key.length !== KEY_BYTES) {
    throw new Error(
      "La chiave di cifratura credenziali deve essere di 32 byte.",
    );
  }

  return key;
}
