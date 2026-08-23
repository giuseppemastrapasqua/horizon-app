"use server";

import { AuditAction } from "@prisma/client";
import { redirect } from "next/navigation";

import { requireRoles } from "@/lib/auth/guards";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

export async function createProperty(
  formData: FormData,
): Promise<void> {
  const user = await requireRoles(["SUPER_ADMIN", "MANAGER"]);

  const ownerId = String(
    formData.get("ownerId") || "",
  ).trim();

  if (!ownerId) {
    throw new Error(
      "Seleziona un proprietario.",
    );
  }

  const owner = await prisma.user.findFirst({
    where: {
      id: ownerId,
      role: "OWNER",
    },
    select: {
      id: true,
    },
  });

  if (!owner) {
    throw new Error(
      "Proprietario non valido.",
    );
  }


  const name = String(
    formData.get("name") || "",
  ).trim();

  const address = String(
    formData.get("address") || "",
  ).trim();

  const city = String(
    formData.get("city") || "Milano",
  ).trim();

  const zone = String(
    formData.get("zone") || "",
  ).trim();

  if (!name) {
    throw new Error(
      "Il nome dell'immobile è obbligatorio.",
    );
  }

  if (!address) {
    throw new Error(
      "L'indirizzo è obbligatorio.",
    );
  }

  if (!city) {
    throw new Error(
      "La città è obbligatoria.",
    );
  }

  if (!zone) {
    throw new Error(
      "La zona è obbligatoria.",
    );
  }

  const maxGuests = Number(
    formData.get("maxGuests") || 1,
  );

  const bedrooms = Number(
    formData.get("bedrooms") || 1,
  );

  const bathrooms = Number(
    formData.get("bathrooms") || 1,
  );

  const cleaningCost = Number(
    formData.get("cleaningCost") || 0,
  );

  const notes = String(
    formData.get("notes") || "",
  ).trim();

  if (
    !Number.isInteger(maxGuests) ||
    maxGuests < 1
  ) {
    throw new Error(
      "Il numero massimo di ospiti non è valido.",
    );
  }

  if (
    !Number.isInteger(bedrooms) ||
    bedrooms < 0
  ) {
    throw new Error(
      "Il numero di camere non è valido.",
    );
  }

  if (
    !Number.isInteger(bathrooms) ||
    bathrooms < 0
  ) {
    throw new Error(
      "Il numero di bagni non è valido.",
    );
  }

  if (
    !Number.isFinite(cleaningCost) ||
    cleaningCost < 0
  ) {
    throw new Error(
      "Il costo pulizia non è valido.",
    );
  }


  const initialScore = calculateInitialScore({
    zone,
    maxGuests,
  });

  const property =
    await prisma.$transaction(
      async (transaction) => {
        const createdProperty =
          await transaction.property.create({
            data: {
              ownerId: owner.id,
              name,
              address,
              city,
              zone,
              maxGuests,
              bedrooms,
              bathrooms,
              cleaningCost,
              initialScore,
              currentScore: initialScore,
              notes,
              status: "ACTIVE",
            },
            select: {
              id: true,
              ownerId: true,
              name: true,
              address: true,
              city: true,
              zone: true,
              maxGuests: true,
              bedrooms: true,
              bathrooms: true,
              cleaningCost: true,
              initialScore: true,
              currentScore: true,
              status: true,
            },
          });

        await AuditService.log(
          {
            actorId:
              user.id,
            action: AuditAction.CREATE,
            propertyId:
              createdProperty.id,
            entityType:
              AUDIT_ENTITY_TYPES.PROPERTY,
            entityId:
              createdProperty.id,
            description:
              "Immobile creato.",
            metadata: {
              ownerId:
                createdProperty.ownerId,
              name: createdProperty.name,
              address:
                createdProperty.address,
              city: createdProperty.city,
              zone: createdProperty.zone,
              maxGuests:
                createdProperty.maxGuests,
              bedrooms:
                createdProperty.bedrooms,
              bathrooms:
                createdProperty.bathrooms,
              cleaningCost:
                createdProperty.cleaningCost,
              initialScore:
                createdProperty.initialScore,
              currentScore:
                createdProperty.currentScore,
              status:
                createdProperty.status,
            },
          },
          transaction,
        );

        return createdProperty;
      },
    );

  redirect(
    `/properties/${property.id}/edit`,
  );
}

function calculateInitialScore({
  zone,
  maxGuests,
}: {
  zone: string;
  maxGuests: number;
}): number {
  let score = 70;

  const premiumZones = [
    "brera",
    "duomo",
    "porta nuova",
    "garibaldi",
    "isola",
  ];

  if (
    premiumZones.includes(
      zone.toLowerCase(),
    )
  ) {
    score += 8;
  }

  if (maxGuests >= 4) {
    score += 4;
  }

  return Math.min(score, 90);
}
