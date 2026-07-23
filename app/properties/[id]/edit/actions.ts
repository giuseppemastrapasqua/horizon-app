"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function updatePropertyAction(
  formData: FormData
) {
  const propertyId = String(
    formData.get("propertyId") ?? ""
  ).trim();

  const name = String(
    formData.get("name") ?? ""
  ).trim();

  const address = String(
    formData.get("address") ?? ""
  ).trim();

  const descriptionValue = String(
    formData.get("description") ?? ""
  ).trim();

  const cleaningCostValue = Number(
    formData.get("cleaningCost") ?? 0
  );

  if (!propertyId) {
    throw new Error("Identificativo immobile mancante.");
  }

  if (!name) {
    throw new Error("Il nome dell’immobile è obbligatorio.");
  }

  if (!address) {
    throw new Error("L’indirizzo è obbligatorio.");
  }

  if (
    !Number.isFinite(cleaningCostValue) ||
    cleaningCostValue < 0
  ) {
    throw new Error(
      "Il costo pulizia deve essere un numero valido."
    );
  }

  await prisma.property.update({
    where: {
      id: propertyId,
    },
    data: {
      name,
      address,
      description:
        descriptionValue.length > 0
          ? descriptionValue
          : null,
      cleaningCost: cleaningCostValue,
    },
  });

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/edit`);
  revalidatePath("/properties");

  redirect(`/properties/${propertyId}`);
}