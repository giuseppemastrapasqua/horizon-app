"use server";

import { revalidatePath } from "next/cache";
import { requirePropertyRole } from "@/lib/auth/guards";

import { createPropertyImage } from "@/lib/application/properties/create-property-image";
import { deletePropertyImage } from "@/lib/application/properties/delete-property-image";
import { setPropertyCoverImage } from "@/lib/application/properties/set-property-cover-image";
import { updatePropertyImageOrder } from "@/lib/application/properties/update-property-image-order";

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

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
  revalidatePath("/properties");
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

  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]);

  const maxFileSize = 10 * 1024 * 1024;

  for (const file of files) {
    if (file.size > maxFileSize) {
      throw new Error(
        `L'immagine "${file.name}" supera la dimensione massima di 10 MB.`,
      );
    }

    if (!allowedTypes.has(file.type)) {
      throw new Error(
        `L'immagine "${file.name}" ha un formato non supportato.`,
      );
    }
  }

  await requirePropertyRole(propertyId, ["OWNER", "MANAGER"]);

  for (const file of files) {
    await createPropertyImage({
      propertyId,
      file,
    });
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
  revalidatePath("/properties");
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

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
  revalidatePath("/properties");
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

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
  revalidatePath("/properties");
}
