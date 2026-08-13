import { randomUUID } from "node:crypto";
import path from "node:path";

import { defaultStorageProvider } from "@/lib/storage/default-storage-provider";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
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

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Formato immagine non supportato.");
  }

  const extension = getExtension(file);

  const key = path.posix.join(
    "properties",
    propertyId,
    `${randomUUID()}.${extension}`,
  );

  const bytes = new Uint8Array(await file.arrayBuffer());

  return defaultStorageProvider.upload({
    key,
    data: bytes,
    contentType: file.type,
  });
}

function getExtension(file: File): string {
  switch (file.type) {
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