"use server";

import {
  AuditAction,
  PropertyStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requirePropertyAccess,
  requireRoles,
} from "@/lib/auth/guards";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

const deletionCountSelect = {
  bookings: true,
  documents: true,
  financeFormulas: true,
  financeReports: true,
  tasks: true,
  revenueMarketSnapshots: true,
  revenueDailySignals: true,
  revenueRecommendations: true,
} as const;

export async function archivePropertyAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") || "",
  ).trim();

  if (!propertyId) {
    throw new Error("Struttura non specificata.");
  }

  const user = await requirePropertyAccess(propertyId);

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  if (property.status === PropertyStatus.ARCHIVED) {
    return;
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.ARCHIVED,
      },
    });

    await AuditService.log(
      {
        actorId: user.id,
        action: AuditAction.UPDATE,
        propertyId,
        entityType: AUDIT_ENTITY_TYPES.PROPERTY,
        entityId: propertyId,
        description: "Immobile archiviato.",
        metadata: {
          previousStatus: property.status,
          status: PropertyStatus.ARCHIVED,
        },
      },
      transaction,
    );
  });

  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/properties/${propertyId}/edit`);
}

async function getPropertyForPermanentDeletion(
  propertyId: string,
) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      name: true,
      status: true,
      _count: {
        select: deletionCountSelect,
      },
    },
  });

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  if (property.status !== PropertyStatus.ARCHIVED) {
    throw new Error(
      "La struttura deve essere archiviata prima dell'eliminazione definitiva.",
    );
  }

  const operationalRecords =
    property._count.bookings +
    property._count.documents +
    property._count.financeFormulas +
    property._count.financeReports +
    property._count.tasks +
    property._count.revenueMarketSnapshots +
    property._count.revenueDailySignals +
    property._count.revenueRecommendations;

  if (operationalRecords > 0) {
    throw new Error(
      "Eliminazione definitiva bloccata: la struttura contiene dati operativi o storici. Mantienila archiviata.",
    );
  }

  return property;
}

export async function checkPermanentPropertyDeletionAction(
  formData: FormData,
): Promise<void> {
  await requireRoles(["SUPER_ADMIN"]);

  const propertyId = String(
    formData.get("propertyId") || "",
  ).trim();

  if (!propertyId) {
    throw new Error("Struttura non specificata.");
  }

  await getPropertyForPermanentDeletion(propertyId);
}

export async function permanentlyDeletePropertyAction(
  formData: FormData,
): Promise<void> {
  await requireRoles(["SUPER_ADMIN"]);

  const propertyId = String(
    formData.get("propertyId") || "",
  ).trim();

  const confirmation = String(
    formData.get("confirmation") || "",
  ).trim();

  if (!propertyId) {
    throw new Error("Struttura non specificata.");
  }

  const property =
    await getPropertyForPermanentDeletion(propertyId);

  if (confirmation !== property.name) {
    throw new Error(
      "Conferma non valida: inserisci esattamente il nome della struttura.",
    );
  }

  await prisma.property.delete({
    where: {
      id: propertyId,
    },
  });

  revalidatePath("/properties");

  redirect("/properties");
}
