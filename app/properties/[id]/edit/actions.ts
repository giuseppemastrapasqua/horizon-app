"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

export async function updatePropertyAction(
  formData: FormData,
) {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  const name = String(
    formData.get("name") ?? "",
  ).trim();

  const address = String(
    formData.get("address") ?? "",
  ).trim();

  const descriptionValue = String(
    formData.get("description") ?? "",
  ).trim();

  const cleaningCostValue = Number(
    formData.get("cleaningCost") ?? 0,
  );

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  if (!name) {
    throw new Error(
      "Il nome dell’immobile è obbligatorio.",
    );
  }

  if (!address) {
    throw new Error(
      "L’indirizzo è obbligatorio.",
    );
  }

  if (
    !Number.isFinite(cleaningCostValue) ||
    cleaningCostValue < 0
  ) {
    throw new Error(
      "Il costo pulizia deve essere un numero valido.",
    );
  }

  const description =
    descriptionValue.length > 0
      ? descriptionValue
      : null;

  await prisma.$transaction(
    async (transaction) => {
      const currentProperty =
        await transaction.property.findUnique({
          where: {
            id: propertyId,
          },
          select: {
            id: true,
            name: true,
            address: true,
            description: true,
            cleaningCost: true,
          },
        });

      if (!currentProperty) {
        throw new Error(
          "Immobile non trovato.",
        );
      }

      const changedFields: string[] = [];

      if (currentProperty.name !== name) {
        changedFields.push("name");
      }

      if (
        currentProperty.address !== address
      ) {
        changedFields.push("address");
      }

      if (
        currentProperty.description !==
        description
      ) {
        changedFields.push("description");
      }

      if (
        Number(currentProperty.cleaningCost) !==
        cleaningCostValue
      ) {
        changedFields.push("cleaningCost");
      }

      await transaction.property.update({
        where: {
          id: propertyId,
        },
        data: {
          name,
          address,
          description,
          cleaningCost: cleaningCostValue,
        },
      });

      if (changedFields.length === 0) {
        return;
      }

      await AuditService.log(
        {
          action: AuditAction.UPDATE,
          propertyId,
          entityType:
            AUDIT_ENTITY_TYPES.PROPERTY,
          entityId: propertyId,
          description:
            "Dati principali dell’immobile aggiornati.",
          metadata: {
            changedFields,
            previousValues: {
              name: currentProperty.name,
              address: currentProperty.address,
              description:
                currentProperty.description,
              cleaningCost: Number(
                currentProperty.cleaningCost,
              ),
            },
            newValues: {
              name,
              address,
              description,
              cleaningCost:
                cleaningCostValue,
            },
          },
        },
        transaction,
      );
    },
  );

  revalidatePath(
    `/properties/${propertyId}`,
  );
  revalidatePath(
    `/properties/${propertyId}/edit`,
  );
  revalidatePath("/properties");

  redirect(`/properties/${propertyId}`);
}