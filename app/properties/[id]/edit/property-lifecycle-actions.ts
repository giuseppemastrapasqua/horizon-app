"use server";

import {
  AuditAction,
  PropertyStatus,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requirePropertyRole,
  requireRoles,
} from "@/lib/auth/guards";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

import { assertPropertyCanBeDeleted, PropertyDeletionError, propertyDeletionCountSelect } from "@/lib/properties/permanent-deletion-policy";

export async function archivePropertyAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") || "",
  ).trim();

  if (!propertyId) {
    throw new Error("Struttura non specificata.");
  }

  const user = await requirePropertyRole(propertyId, ["MANAGER"]);

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      status: true,
    },
  });

  if (!property) {
    throw new PropertyDeletionError("Immobile non trovato.");
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
  database: Pick<Prisma.TransactionClient, "property"> = prisma,
) {
  const property = await database.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      name: true,
      status: true,
      _count: {
        select: propertyDeletionCountSelect,
      },
    },
  });

  if (!property) {
    throw new PropertyDeletionError("Immobile non trovato.");
  }

  assertPropertyCanBeDeleted(property);

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

async function deleteConfirmedProperty(formData: FormData, actorId: string) {
  const propertyId = String(formData.get("propertyId") || "").trim();
  const confirmation = String(formData.get("confirmation") || "").trim();
  if (!propertyId) throw new PropertyDeletionError("Struttura non specificata.");
  await prisma.$transaction(async (transaction) => {
    const property = await getPropertyForPermanentDeletion(propertyId, transaction);
    if (confirmation !== property.name) throw new PropertyDeletionError("Conferma non valida: inserisci esattamente il nome della struttura.");
    await transaction.property.delete({ where: { id: propertyId } });
    await AuditService.log({ actorId, action: AuditAction.DELETE, propertyId,
      entityType: AUDIT_ENTITY_TYPES.PROPERTY, entityId: propertyId,
      description: "Struttura archiviata senza storico eliminata definitivamente.",
      metadata: { name: property.name, previousStatus: property.status } }, transaction);
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

function finishPropertyDeletion(): never {
  revalidatePath("/properties");
  revalidatePath("/activation");
  redirect("/properties");
}

export async function permanentlyDeletePropertyAction(formData: FormData): Promise<void> {
  const user = await requireRoles(["SUPER_ADMIN"]);
  await deleteConfirmedProperty(formData, user.id);
  finishPropertyDeletion();
}

export async function deletePropertyWithFeedbackAction(
  _previous: { message: string }, formData: FormData,
): Promise<{ message: string }> {
  const user = await requireRoles(["SUPER_ADMIN"]);
  try {
    await deleteConfirmedProperty(formData, user.id);
  } catch (error) {
    if (error instanceof PropertyDeletionError) return { message: error.message };
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (["P2003", "P2014"].includes(error.code)) return { message: "Eliminazione bloccata da altri dati collegati. Mantieni la struttura archiviata e verifica lo storico." };
      if (error.code === "P2034") return { message: "La struttura è stata modificata durante il controllo. Ricarica la pagina e riprova." };
      if (error.code === "P2025") return { message: "La struttura non è più disponibile. Torna all’elenco alloggi e aggiorna la pagina." };
    }
    console.error("Property deletion failed", error instanceof Prisma.PrismaClientKnownRequestError ? error.code : "unexpected");
    return { message: "Eliminazione non riuscita. Ricarica l’elenco per verificare lo stato della struttura prima di riprovare." };
  }
  // Navigation exceptions must never be swallowed by the error handler.
  finishPropertyDeletion();
}
