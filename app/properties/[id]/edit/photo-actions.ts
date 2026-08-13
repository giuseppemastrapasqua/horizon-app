"use server";

import { revalidatePath } from "next/cache";

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

  const fileValue = formData.get("file");

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  if (!(fileValue instanceof File)) {
    throw new Error(
      "Seleziona un'immagine da caricare.",
    );
  }

  await createPropertyImage({
    propertyId,
    file: fileValue,
  });

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