"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { requirePropertyAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

export async function updatePropertyHouseRulesAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  const houseRuleIds = Array.from(
    new Set(
      formData
        .getAll("houseRuleIds")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

  await requirePropertyAccess(propertyId);

  const property =
    await prisma.property.findUnique({
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

  if (houseRuleIds.length > 0) {
    const validHouseRules =
      await prisma.houseRule.findMany({
        where: {
          id: {
            in: houseRuleIds,
          },
          isActive: true,
        },
        select: {
          id: true,
        },
      });

    if (
      validHouseRules.length !==
      houseRuleIds.length
    ) {
      throw new Error(
        "Una o più regole selezionate non sono valide o non sono attive.",
      );
    }
  }

  await prisma.$transaction(
    async (transaction) => {
      const currentHouseRules =
        await transaction.propertyHouseRule.findMany({
          where: {
            propertyId,
          },
          select: {
            houseRuleId: true,
          },
        });

      const currentHouseRuleIds =
        currentHouseRules.map(
          (propertyHouseRule) =>
            propertyHouseRule.houseRuleId,
        );

      const addedHouseRuleIds =
        houseRuleIds.filter(
          (houseRuleId) =>
            !currentHouseRuleIds.includes(
              houseRuleId,
            ),
        );

      const removedHouseRuleIds =
        currentHouseRuleIds.filter(
          (houseRuleId) =>
            !houseRuleIds.includes(
              houseRuleId,
            ),
        );

      if (
        addedHouseRuleIds.length === 0 &&
        removedHouseRuleIds.length === 0
      ) {
        return;
      }

      await transaction.propertyHouseRule.deleteMany({
        where: {
          propertyId,
        },
      });

      if (houseRuleIds.length > 0) {
        await transaction.propertyHouseRule.createMany({
          data: houseRuleIds.map(
            (houseRuleId) => ({
              propertyId,
              houseRuleId,
            }),
          ),
        });
      }

      await AuditService.log(
        {
          action: AuditAction.UPDATE,
          propertyId,
          entityType:
            AUDIT_ENTITY_TYPES.HOUSE_RULE,
          entityId: propertyId,
          description:
            "Regole della casa aggiornate.",
          metadata: {
            addedHouseRuleIds,
            removedHouseRuleIds,
            totalHouseRules:
              houseRuleIds.length,
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
}
