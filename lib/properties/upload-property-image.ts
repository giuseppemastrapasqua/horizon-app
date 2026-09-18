import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  detectSupportedUploadType,
  type SupportedUploadType,
} from "@/lib/security/upload-file-signature";
import { defaultStorageProvider } from "@/lib/storage/default-storage-provider";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set<SupportedUploadType>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type UploadPropertyImageInput = {
  propertyId: string;
  file: File;
};

export async function uploadPropertyImage({
  propertyId,
  file,
}: UploadPropertyImageInput) {
  if (file.size === 0) {
    throw new Error("Il file è vuoto.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "L'immagine supera la dimensione massima consentita.",
    );
  }

  const declaredType =
    file.type.trim().toLowerCase() as SupportedUploadType;

  if (!ALLOWED_TYPES.has(declaredType)) {
    throw new Error("Formato immagine non supportato.");
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
      "Il contenuto del file non corrisponde a un'immagine supportata.",
    );
  }

  if (detectedType !== declaredType) {
    throw new Error(
      "Il contenuto del file non corrisponde al formato dichiarato.",
    );
  }

  const extension = getExtension(detectedType);

  const key = path.posix.join(
    "properties",
    propertyId,
    `${randomUUID()}.${extension}`,
  );

  return defaultStorageProvider.upload({
    key,
    data: bytes,
    contentType: detectedType,
  });
}

function getExtension(
  contentType: SupportedUploadType,
): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error("Formato immagine non supportato.");
  }
}
