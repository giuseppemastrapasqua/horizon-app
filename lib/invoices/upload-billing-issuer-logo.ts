import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  detectSupportedUploadType,
  type SupportedUploadType,
} from "@/lib/security/upload-file-signature";
import { defaultStorageProvider } from "@/lib/storage/default-storage-provider";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set<SupportedUploadType>([
  "image/jpeg",
  "image/png",
]);

export async function uploadBillingIssuerLogo(file: File) {
  if (file.size === 0) {
    throw new Error("Il file del logo è vuoto.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "Il logo supera la dimensione massima di 2 MB.",
    );
  }

  const declaredType =
    file.type.trim().toLowerCase() as SupportedUploadType;

  if (!ALLOWED_TYPES.has(declaredType)) {
    throw new Error(
      "Il logo deve essere in formato PNG o JPEG.",
    );
  }

  const bytes = new Uint8Array(
    await file.arrayBuffer(),
  );

  const detectedType =
    detectSupportedUploadType(bytes);

  if (
    detectedType === null ||
    !ALLOWED_TYPES.has(detectedType)
  ) {
    throw new Error(
      "Il contenuto del logo non corrisponde a un'immagine supportata.",
    );
  }

  if (detectedType !== declaredType) {
    throw new Error(
      "Il contenuto del logo non corrisponde al formato dichiarato.",
    );
  }

  const extension =
    detectedType === "image/png" ? "png" : "jpg";

  const key = path.posix.join(
    "billing-issuers",
    "DEFAULT",
    `${randomUUID()}.${extension}`,
  );

  return defaultStorageProvider.upload({
    key,
    data: bytes,
    contentType: detectedType,
  });
}
