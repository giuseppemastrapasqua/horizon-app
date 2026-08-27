"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { requirePropertyAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

export async function updatePropertyAmenitiesAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") ?? "",
  ).trim();

  const amenityIds = Array.from(
    new Set(
      formData
        .getAll("amenityIds")
        .map((value) => String(value).trim())
        .filter(Boolean),
    ),
  );

  if (!propertyId) {
    throw new Error(
      "Identificativo immobile mancante.",
    );
  }

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

  if (amenityIds.length > 0) {
    const validAmenities =
      await prisma.amenity.findMany({
        where: {
          id: {
            in: amenityIds,
          },
          isActive: true,
        },
        select: {
          id: true,
        },
      });

    if (
      validAmenities.length !==
      amenityIds.length
    ) {
      throw new Error(
        "Uno o più servizi selezionati non sono validi o non sono attivi.",
      );
    }
  }

  await prisma.$transaction(
    async (transaction) => {
      const currentAmenities =
        await transaction.propertyAmenity.findMany({
          where: {
            propertyId,
          },
          select: {
            amenityId: true,
          },
        });

      const currentAmenityIds =
        currentAmenities.map(
          (propertyAmenity) =>
            propertyAmenity.amenityId,
        );

      const addedAmenityIds =
        amenityIds.filter(
          (amenityId) =>
            !currentAmenityIds.includes(
              amenityId,
            ),
        );

      const removedAmenityIds =
        currentAmenityIds.filter(
          (amenityId) =>
            !amenityIds.includes(amenityId),
        );

      if (
        addedAmenityIds.length === 0 &&
        removedAmenityIds.length === 0
      ) {
        return;
      }

      await transaction.propertyAmenity.deleteMany({
        where: {
          propertyId,
        },
      });

      if (amenityIds.length > 0) {
        await transaction.propertyAmenity.createMany({
          data: amenityIds.map(
            (amenityId) => ({
              propertyId,
              amenityId,
            }),
          ),
        });
      }

      const changedAmenityIds = [
        ...addedAmenityIds,
        ...removedAmenityIds,
      ];

      const changedAmenities =
        changedAmenityIds.length > 0
          ? await transaction.amenity.findMany({
              where: {
                id: {
                  in: changedAmenityIds,
                },
              },
              select: {
                id: true,
                label: true,
              },
            })
          : [];

      const amenityNamesById = new Map(
        changedAmenities.map((amenity) => [
          amenity.id,
          amenity.label,
        ]),
      );

      const addedAmenities =
        addedAmenityIds.map((amenityId) => ({
          id: amenityId,
          name:
            amenityNamesById.get(amenityId) ??
            amenityId,
        }));

      const removedAmenities =
        removedAmenityIds.map(
          (amenityId) => ({
            id: amenityId,
            name:
              amenityNamesById.get(
                amenityId,
              ) ?? amenityId,
          }),
        );

      await AuditService.log(
        {
          action: AuditAction.UPDATE,
          propertyId,
          entityType:
            AUDIT_ENTITY_TYPES.PROPERTY_AMENITY,
          entityId: propertyId,
          description:
            "Servizi dell’immobile aggiornati.",
          metadata: {
            addedAmenities,
            removedAmenities,
            totalAmenities:
              amenityIds.length,
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