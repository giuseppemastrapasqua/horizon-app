"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { requirePropertyAccess } from "@/lib/auth/guards";
import { AuditService } from "@/services/audit/AuditService";

export async function updatePropertyAction(
  formData: FormData,
) {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  const user =
    await requirePropertyAccess(propertyId);

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

  const propertyManagementCommissionPercent =
    Number(
      formData.get(
        "propertyManagementCommissionPercent"
      ) ?? 0
    );
  const horizonCommissionPercent = Number(
    formData.get(
      "horizonCommissionPercent",
    ) ?? 0,
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

  if (
    !Number.isFinite(
      horizonCommissionPercent,
    ) ||
    horizonCommissionPercent < 0 ||
    horizonCommissionPercent >= 100
  ) {
    throw new Error(
      "La commissione Horizon deve essere compresa tra 0 e 99,99.",
    );
  }

  if (
    !Number.isFinite(
      propertyManagementCommissionPercent,
    ) ||
    propertyManagementCommissionPercent < 0 ||
    propertyManagementCommissionPercent >= 100
  ) {
    throw new Error(
      "La commissione di gestione deve essere compresa tra 0 e 99,99.",
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
            horizonCommissionPercent: true,
            propertyManagementCommissionPercent: true,
          },
        });

      if (!currentProperty) {
        throw new Error(
          "Immobile non trovato.",
        );
      }

      const changedFields: string[] = [];

      if (
        currentProperty.name !== name
      ) {
        changedFields.push(
          "name",
        );
      }

      if (
        currentProperty.address !==
        address
      ) {
        changedFields.push(
          "address",
        );
      }

      if (
        currentProperty.description !==
        description
      ) {
        changedFields.push(
          "description",
        );
      }

      if (
        Number(
          currentProperty.cleaningCost,
        ) !== cleaningCostValue
      ) {
        changedFields.push(
          "cleaningCost",
        );
      }

      if (
        Number(
          currentProperty.horizonCommissionPercent,
        ) !== horizonCommissionPercent
      ) {
        changedFields.push(
          "horizonCommissionPercent",
        );
      }

      if (
        Number(
          currentProperty.propertyManagementCommissionPercent,
        ) !== propertyManagementCommissionPercent
      ) {
        changedFields.push(
          "propertyManagementCommissionPercent",
        );
      }

      await transaction.property.update({
        where: {
          id: propertyId,
        },

        data: {
          name,
          address,
          description,
          cleaningCost:
            cleaningCostValue,
          horizonCommissionPercent,
          propertyManagementCommissionPercent,
        },
      });

      if (
        changedFields.length === 0
      ) {
        return;
      }

      await AuditService.log(
        {
          actorId:
            user.id,

          action:
            AuditAction.UPDATE,

          propertyId,

          entityType:
            AUDIT_ENTITY_TYPES.PROPERTY,

          entityId:
            propertyId,

          description:
            "Dati principali dell’immobile aggiornati.",

          metadata: {
            changedFields,

            previousValues: {
              name:
                currentProperty.name,

              address:
                currentProperty.address,

              description:
                currentProperty.description,

              cleaningCost:
                Number(
                  currentProperty.cleaningCost,
                ),

              horizonCommissionPercent:
                Number(
                  currentProperty.horizonCommissionPercent,
                ),

              propertyManagementCommissionPercent:
                Number(
                  currentProperty.propertyManagementCommissionPercent,
                ),
            },

            newValues: {
              name,
              address,
              description,

              cleaningCost:
                cleaningCostValue,

              horizonCommissionPercent,
          propertyManagementCommissionPercent,
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

  revalidatePath(
    "/properties",
  );

  revalidatePath(
    "/calendar",
  );

  redirect(
    `/properties/${propertyId}`,
  );
}