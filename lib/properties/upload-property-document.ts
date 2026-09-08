import { randomUUID } from "node:crypto";

import { encryptDocument } from "@/lib/security/document-crypto";
import { defaultPrivateStorageProvider } from "@/lib/storage/default-private-storage-provider";

const DOCUMENT_ENCRYPTION_KEY_ENV =
  "HORIZON_DOCUMENT_ENCRYPTION_KEY";

const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024;
const ENCRYPTION_VERSION = "v1";
const ENCRYPTED_CONTENT_TYPE =
  "application/octet-stream";

const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type UploadedPropertyDocument = {
  storageKey: string;
  filename: string;
  contentType: string;
  fileSize: number;
  encryptionVersion: string;
};

export async function uploadPropertyDocument(
  propertyId: string,
  file: File,
): Promise<UploadedPropertyDocument> {
  if (!file.name.trim() || file.size === 0) {
    throw new Error("Seleziona un file valido.");
  }

  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new Error(
      "Il documento supera il limite di 25 MB.",
    );
  }

  const contentType = file.type.trim().toLowerCase();

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error(
      "Formato documento non supportato. Usa PDF, JPG, PNG o WEBP.",
    );
  }

  const encryptionKey =
    process.env[DOCUMENT_ENCRYPTION_KEY_ENV];

  if (!encryptionKey?.trim()) {
    throw new Error(
      `${DOCUMENT_ENCRYPTION_KEY_ENV} non configurata.`,
    );
  }

  const plaintext = new Uint8Array(
    await file.arrayBuffer(),
  );

  const encrypted = encryptDocument(
    plaintext,
    encryptionKey,
  );

  const storageKey = [
    "properties",
    propertyId,
    "documents",
    `${randomUUID()}.hzdoc`,
  ].join("/");

  const uploaded =
    await defaultPrivateStorageProvider.upload({
      key: storageKey,
      data: encrypted,
      contentType: ENCRYPTED_CONTENT_TYPE,
    });

  return {
    storageKey: uploaded.key,
    filename: file.name.trim(),
    contentType,
    fileSize: file.size,
    encryptionVersion: ENCRYPTION_VERSION,
  };
}

