import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const MAGIC = Buffer.from("HZDOC", "ascii");
const VERSION = 1;
const HEADER_BYTES =
  MAGIC.length + 1 + IV_BYTES + AUTH_TAG_BYTES;

export type EncryptedDocument = Uint8Array;

export function encryptDocument(
  plaintext: Uint8Array,
  keyBase64: string,
): EncryptedDocument {
  if (plaintext.byteLength === 0) {
    throw new Error(
      "Il documento da cifrare è vuoto.",
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
    cipher.update(Buffer.from(plaintext)),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return Buffer.concat([
    MAGIC,
    Buffer.from([VERSION]),
    iv,
    authTag,
    ciphertext,
  ]);
}

export function decryptDocument(
  encrypted: Uint8Array,
  keyBase64: string,
): Uint8Array {
  const payload = Buffer.from(encrypted);

  if (payload.length <= HEADER_BYTES) {
    throw new Error(
      "Formato documento cifrato non valido.",
    );
  }

  const magic = payload.subarray(
    0,
    MAGIC.length,
  );

  if (!magic.equals(MAGIC)) {
    throw new Error(
      "Formato documento cifrato non valido.",
    );
  }

  const version = payload[MAGIC.length];

  if (version !== VERSION) {
    throw new Error(
      `Versione documento cifrato non supportata: ${version}.`,
    );
  }

  const ivStart = MAGIC.length + 1;
  const tagStart = ivStart + IV_BYTES;
  const ciphertextStart =
    tagStart + AUTH_TAG_BYTES;

  const iv = payload.subarray(
    ivStart,
    tagStart,
  );
  const authTag = payload.subarray(
    tagStart,
    ciphertextStart,
  );
  const ciphertext = payload.subarray(
    ciphertextStart,
  );

  const decipher = createDecipheriv(
    ALGORITHM,
    decodeKey(keyBase64),
    iv,
  );

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
}

function decodeKey(
  keyBase64: string,
): Buffer {
  if (!keyBase64.trim()) {
    throw new Error(
      "Chiave di cifratura documenti non configurata.",
    );
  }

  const key = Buffer.from(
    keyBase64,
    "base64",
  );

  if (key.length !== KEY_BYTES) {
    throw new Error(
      "La chiave di cifratura documenti deve essere di 32 byte.",
    );
  }

  return key;
}
