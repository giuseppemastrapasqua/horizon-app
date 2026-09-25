"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import {
  createPropertyImage,
  createPropertyImageFromUploadedObject,
} from "@/lib/application/properties/create-property-image";
import { deletePropertyImage } from "@/lib/application/properties/delete-property-image";
import { setPropertyCoverImage } from "@/lib/application/properties/set-property-cover-image";
import { updatePropertyImageOrder } from "@/lib/application/properties/update-property-image-order";
import { requirePropertyRole } from "@/lib/auth/guards";
import {
  detectSupportedUploadType,
  type SupportedUploadType,
} from "@/lib/security/upload-file-signature";
import {
  createPublicStorageSignedUpload,
  deletePublicStorageObject,
  getPublicStorageUrl,
  readPublicStorageObject,
} from "@/lib/storage/supabase-public-storage-direct-upload";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set<SupportedUploadType>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type PreparePropertyImageUploadInput = {
  propertyId: string;
  originalFilename: string;
  mimeType: string;
  size: number;
};

type PreparePropertyImageUploadResult = {
  key: string;
  signedUrl: string;
  token: string;
};

type FinalizePropertyImageUploadInput = {
  propertyId: string;
  key: string;
  originalFilename: string;
  mimeType: string;
  size: number;
};

export async function setPropertyCoverImageAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  const imageId = String(
    formData.get("imageId") ?? "",
  ).trim();

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  if (!imageId) {
    throw new Error(
      "Identificativo immagine mancante.",
    );
  }

  await requirePropertyRole(propertyId, ["OWNER", "MANAGER"]);

  await setPropertyCoverImage({
    propertyId,
    imageId,
  });

  revalidatePropertyPaths(propertyId);
}

export async function preparePropertyImageUploadAction({
  propertyId,
  originalFilename,
  mimeType,
  size,
}: PreparePropertyImageUploadInput): Promise<PreparePropertyImageUploadResult> {
  const normalizedPropertyId = propertyId.trim();
  const normalizedMimeType =
    normalizeImageMimeType(mimeType);

  if (!normalizedPropertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  validateImageMetadata({
    originalFilename,
    mimeType: normalizedMimeType,
    size,
  });

  await requirePropertyRole(
    normalizedPropertyId,
    ["OWNER", "MANAGER"],
  );

  const extension =
    getImageExtension(normalizedMimeType);

  const key =
    `properties/${normalizedPropertyId}/${randomUUID()}.${extension}`;

  return createPublicStorageSignedUpload(key);
}

export async function finalizePropertyImageUploadAction({
  propertyId,
  key,
  originalFilename,
  mimeType,
  size,
}: FinalizePropertyImageUploadInput): Promise<void> {
  const normalizedPropertyId = propertyId.trim();
  const normalizedMimeType =
    normalizeImageMimeType(mimeType);
  const normalizedKey = key.trim();

  if (!normalizedPropertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  validateImageMetadata({
    originalFilename,
    mimeType: normalizedMimeType,
    size,
  });

  validatePropertyImageKey({
    propertyId: normalizedPropertyId,
    key: normalizedKey,
    mimeType: normalizedMimeType,
  });

  await requirePropertyRole(
    normalizedPropertyId,
    ["OWNER", "MANAGER"],
  );

  let bytes: Uint8Array;

  try {
    bytes =
      await readPublicStorageObject(normalizedKey);
  } catch (error) {
    throw error;
  }

  try {
    if (bytes.byteLength === 0) {
      throw new Error(
        "La foto caricata è vuota.",
      );
    }

    if (bytes.byteLength > MAX_FILE_SIZE) {
      throw new Error(
        "La foto caricata supera la dimensione massima di 10 MB.",
      );
    }

    if (bytes.byteLength !== size) {
      throw new Error(
        "La dimensione della foto caricata non corrisponde al file selezionato.",
      );
    }

    const detectedType =
      detectSupportedUploadType(bytes);

    if (
      detectedType === null ||
      !ALLOWED_IMAGE_TYPES.has(detectedType)
    ) {
      throw new Error(
        "Il contenuto della foto caricata non è supportato.",
      );
    }

    if (detectedType !== normalizedMimeType) {
      throw new Error(
        "Il contenuto della foto non corrisponde al formato dichiarato.",
      );
    }

    await createPropertyImageFromUploadedObject({
      propertyId: normalizedPropertyId,
      key: normalizedKey,
      url: getPublicStorageUrl(normalizedKey),
      originalFilename:
        originalFilename.trim() || null,
      mimeType: detectedType,
      size: bytes.byteLength,
    });
  } catch (error) {
    await deletePublicStorageObject(
      normalizedKey,
    ).catch(() => {
      // Manteniamo l'errore originale di validazione/finalizzazione.
    });

    throw error;
  }

  revalidatePropertyPaths(normalizedPropertyId);
}

export async function uploadPropertyImageAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  const files = formData
    .getAll("files")
    .filter(
      (value): value is File =>
        value instanceof File && value.size > 0,
    );

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  if (files.length === 0) {
    throw new Error(
      "Seleziona almeno un'immagine da caricare.",
    );
  }

  if (files.length > 20) {
    throw new Error(
      "Puoi caricare al massimo 20 immagini alla volta.",
    );
  }

  for (const file of files) {
    validateImageMetadata({
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size,
    });
  }

  await requirePropertyRole(propertyId, ["OWNER", "MANAGER"]);

  for (const file of files) {
    await createPropertyImage({
      propertyId,
      file,
    });
  }

  revalidatePropertyPaths(propertyId);
}

export async function deletePropertyImageAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  const imageId = String(
    formData.get("imageId") ?? "",
  ).trim();

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  if (!imageId) {
    throw new Error(
      "Identificativo immagine mancante.",
    );
  }

  await requirePropertyRole(propertyId, ["OWNER", "MANAGER"]);

  await deletePropertyImage({
    propertyId,
    imageId,
  });

  revalidatePropertyPaths(propertyId);
}

export async function reorderPropertyImagesAction(
  imageIds: string[],
  propertyId: string,
): Promise<void> {
  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  if (imageIds.length === 0) {
    return;
  }

  await requirePropertyRole(propertyId, ["OWNER", "MANAGER"]);

  await updatePropertyImageOrder({
    propertyId,
    imageIds,
  });

  revalidatePropertyPaths(propertyId);
}

function validateImageMetadata({
  originalFilename,
  mimeType,
  size,
}: {
  originalFilename: string;
  mimeType: string;
  size: number;
}): void {
  const normalizedFilename =
    originalFilename.trim();

  if (!normalizedFilename) {
    throw new Error(
      "Nome del file immagine mancante.",
    );
  }

  const normalizedMimeType =
    normalizeImageMimeType(mimeType);

  if (
    !ALLOWED_IMAGE_TYPES.has(
      normalizedMimeType,
    )
  ) {
    throw new Error(
      `L'immagine "${normalizedFilename}" ha un formato non supportato.`,
    );
  }

  if (
    !Number.isSafeInteger(size) ||
    size <= 0
  ) {
    throw new Error(
      `L'immagine "${normalizedFilename}" ha una dimensione non valida.`,
    );
  }

  if (size > MAX_FILE_SIZE) {
    throw new Error(
      `L'immagine "${normalizedFilename}" supera la dimensione massima di 10 MB.`,
    );
  }
}

function validatePropertyImageKey({
  propertyId,
  key,
  mimeType,
}: {
  propertyId: string;
  key: string;
  mimeType: SupportedUploadType;
}): void {
  const expectedPrefix =
    `properties/${propertyId}/`;

  if (
    !key.startsWith(expectedPrefix) ||
    key.includes("\\") ||
    key.includes("..")
  ) {
    throw new Error(
      "Chiave della foto non valida per questo immobile.",
    );
  }

  const filename =
    key.slice(expectedPrefix.length);

  if (
    !filename ||
    filename.includes("/")
  ) {
    throw new Error(
      "Chiave della foto non valida.",
    );
  }

  const expectedExtension =
    getImageExtension(mimeType);

  const pattern = new RegExp(
    `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\.${expectedExtension}$`,
    "i",
  );

  if (!pattern.test(filename)) {
    throw new Error(
      "Chiave della foto non valida.",
    );
  }
}

function normalizeImageMimeType(
  mimeType: string,
): SupportedUploadType {
  return mimeType
    .trim()
    .toLowerCase() as SupportedUploadType;
}

function getImageExtension(
  mimeType: SupportedUploadType,
): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error(
        "Formato immagine non supportato.",
      );
  }
}

function revalidatePropertyPaths(
  propertyId: string,
): void {
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
  revalidatePath("/properties");
}
