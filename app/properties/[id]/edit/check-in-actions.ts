"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { isPropertyCheckInType } from "@/lib/properties/property-check-in";
import { AuditService } from "@/services/audit/AuditService";

function getOptionalString(
  formData: FormData,
  fieldName: string,
): string | null {
  const value = formData.get(fieldName);

  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : null;
}

export async function updatePropertyCheckInAction(
  formData: FormData,
): Promise<void> {
  const propertyId = getOptionalString(
    formData,
    "propertyId",
  );

  if (!propertyId) {
    throw new Error("Immobile non specificato.");
  }

  const rawCheckInType = getOptionalString(
    formData,
    "checkInType",
  );

  if (
    rawCheckInType &&
    !isPropertyCheckInType(rawCheckInType)
  ) {
    throw new Error(
      "La modalità di check-in selezionata non è valida.",
    );
  }

  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
    select: {
      id: true,
    },
  });

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  const configuration = {
    checkInType: rawCheckInType,
    arrivalInstructions: getOptionalString(
      formData,
      "arrivalInstructions",
    ),
    accessInstructions: getOptionalString(
      formData,
      "accessInstructions",
    ),
    buildingAccessCode: getOptionalString(
      formData,
      "buildingAccessCode",
    ),
    apartmentAccessCode: getOptionalString(
      formData,
      "apartmentAccessCode",
    ),
    wifiName: getOptionalString(
      formData,
      "wifiName",
    ),
    wifiPassword: getOptionalString(
      formData,
      "wifiPassword",
    ),
    emergencyContactName: getOptionalString(
      formData,
      "emergencyContactName",
    ),
    emergencyContactPhone: getOptionalString(
      formData,
      "emergencyContactPhone",
    ),
    parkingInstructions: getOptionalString(
      formData,
      "parkingInstructions",
    ),
    additionalNotes: getOptionalString(
      formData,
      "additionalNotes",
    ),
  };

  await prisma.$transaction(async (transaction) => {
    const previousConfiguration =
      await transaction.propertyCheckInConfiguration.findUnique(
        {
          where: {
            propertyId,
          },
        },
      );

    await transaction.propertyCheckInConfiguration.upsert({
      where: {
        propertyId,
      },
      create: {
        propertyId,
        ...configuration,
      },
      update: configuration,
    });

    const previousData =
      previousConfiguration ?? {};

    if (
      JSON.stringify(previousData) !==
      JSON.stringify(configuration)
    ) {
      await AuditService.log(
        {
          action: AuditAction.UPDATE,
          propertyId,
          entityType:
            AUDIT_ENTITY_TYPES.CHECKIN_CONFIGURATION,
          entityId: propertyId,
          description:
            "Configurazione check-in aggiornata.",
          metadata: {
            previousConfiguration:
              previousConfiguration,
            newConfiguration:
              configuration,
          },
        },
        transaction,
      );
    }
  });

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/edit`);
}