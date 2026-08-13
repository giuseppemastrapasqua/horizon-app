"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export async function updatePropertyRatePlanAction(
  formData: FormData,
): Promise<void> {
  const propertyId =
    String(
      formData.get("propertyId") ?? "",
    ).trim();

  const name =
    String(
      formData.get("name") ?? "Standard",
    ).trim();

  const basePrice =
    parseRequiredNumber(
      formData.get("basePrice"),
      "Tariffa base",
    );

  const minimumStay =
    parseRequiredInteger(
      formData.get("minimumStay"),
      "Soggiorno minimo",
    );

  const maximumStay =
    parseOptionalInteger(
      formData.get("maximumStay"),
      "Soggiorno massimo",
    );

  const occupancyIncluded =
    parseRequiredInteger(
      formData.get("occupancyIncluded"),
      "Ospiti inclusi",
    );

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  if (!name) {
    throw new Error(
      "Il nome del piano tariffario è obbligatorio.",
    );
  }

  if (basePrice <= 0) {
    throw new Error(
      "La tariffa base deve essere maggiore di zero.",
    );
  }

  if (minimumStay < 1) {
    throw new Error(
      "Il soggiorno minimo deve essere almeno 1 notte.",
    );
  }

  if (
    maximumStay !== null &&
    maximumStay < minimumStay
  ) {
    throw new Error(
      "Il soggiorno massimo non può essere inferiore al minimo.",
    );
  }

  if (occupancyIncluded < 1) {
    throw new Error(
      "Gli ospiti inclusi devono essere almeno 1.",
    );
  }

  await prisma.$transaction(
    async (transaction) => {
      const property =
        await transaction.property.findUnique({
          where: {
            id: propertyId,
          },
          select: {
            id: true,
          },
        });

      if (!property) {
        throw new Error(
          "Immobile non trovato.",
        );
      }

      const currentRatePlan =
        await transaction.propertyRatePlan.findFirst({
          where: {
            propertyId,
            isDefault: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        });

      if (currentRatePlan) {
        await transaction.propertyRatePlan.update({
          where: {
            id: currentRatePlan.id,
          },
          data: {
            name,
            active: true,
            isDefault: true,
            basePrice,
            currency: "EUR",
            minimumStay,
            maximumStay,
            occupancyIncluded,
          },
        });

        return;
      }

      await transaction.propertyRatePlan.create({
        data: {
          propertyId,
          name,
          code: "STANDARD",
          active: true,
          isDefault: true,
          basePrice,
          currency: "EUR",
          minimumStay,
          maximumStay,
          occupancyIncluded,
        },
      });
    },
  );

  revalidatePath(
    `/properties/${propertyId}`,
  );

  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
}

function parseRequiredNumber(
  value: FormDataEntryValue | null,
  label: string,
): number {
  const normalized =
    String(value ?? "").trim();

  const number =
    Number(normalized);

  if (
    !normalized ||
    !Number.isFinite(number)
  ) {
    throw new Error(
      `${label} non valida.`,
    );
  }

  return number;
}

function parseRequiredInteger(
  value: FormDataEntryValue | null,
  label: string,
): number {
  const number =
    parseRequiredNumber(
      value,
      label,
    );

  if (!Number.isInteger(number)) {
    throw new Error(
      `${label} deve essere un numero intero.`,
    );
  }

  return number;
}

function parseOptionalInteger(
  value: FormDataEntryValue | null,
  label: string,
): number | null {
  const normalized =
    String(value ?? "").trim();

  if (!normalized) {
    return null;
  }

  return parseRequiredInteger(
    value,
    label,
  );
}
