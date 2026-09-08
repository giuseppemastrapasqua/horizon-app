import { randomUUID } from "node:crypto";
import path from "node:path";

import { defaultStorageProvider } from "@/lib/storage/default-storage-provider";

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
]);

export async function uploadBillingIssuerLogo(file: File) {
  if (file.size === 0) {
    throw new Error("Il file del logo è vuoto.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Il logo supera la dimensione massima di 2 MB.");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Il logo deve essere in formato PNG o JPEG.");
  }

  const extension = file.type === "image/png" ? "png" : "jpg";
  const key = path.posix.join(
    "billing-issuers",
    "DEFAULT",
    `${randomUUID()}.${extension}`,
  );

  const bytes = new Uint8Array(await file.arrayBuffer());

  return defaultStorageProvider.upload({
    key,
    data: bytes,
    contentType: file.type,
  });
}
