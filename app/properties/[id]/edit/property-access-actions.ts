"use server";

import {
  PropertyAccessRole,
  RecordStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const allowedRoles = new Set<PropertyAccessRole>([
  PropertyAccessRole.OWNER,
  PropertyAccessRole.MANAGER,
  PropertyAccessRole.FINANCE,
  PropertyAccessRole.VIEWER,
  PropertyAccessRole.OPERATOR,
]);

export async function updatePropertyAccessAction(
  formData: FormData,
): Promise<void> {
  await requireRoles(["SUPER_ADMIN"]);

  const propertyId = String(
    formData.get("propertyId") || "",
  );

  const userId = String(
    formData.get("userId") || "",
  );

  const enabled =
    String(formData.get("enabled") || "") ===
    "true";

  if (!propertyId || !userId) {
    throw new Error(
      "Struttura o utente non specificato.",
    );
  }

  const [property, user] = await Promise.all([
    prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    }),

    prisma.user.findFirst({
      where: {
        id: userId,
        status: RecordStatus.ACTIVE,
      },
      select: {
        id: true,
        role: true,
      },
    }),
  ]);

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  if (!user) {
    throw new Error(
      "Utente non valido o non attivo.",
    );
  }

  if (user.role === "SUPER_ADMIN") {
    throw new Error(
      "Il Super Admin dispone già di accesso globale.",
    );
  }

  if (enabled && user.role === "OPERATOR" && String(formData.get("role") || "") !== PropertyAccessRole.OPERATOR) {
    throw new Error("Il collaboratore operativo può ricevere solo accesso OPERATOR.");
  }

  if (!enabled) {
    await prisma.propertyAccess.updateMany({
      where: {
        propertyId,
        userId,
        active: true,
      },
      data: {
        active: false,
      },
    });
  } else {
    const role = String(
      formData.get("role") || "",
    ) as PropertyAccessRole;

    if (!allowedRoles.has(role)) {
      throw new Error(
        "Ruolo di accesso non valido.",
      );
    }

    await prisma.propertyAccess.upsert({
      where: {
        propertyId_userId: {
          propertyId,
          userId,
        },
      },
      update: {
        role,
        active: true,
      },
      create: {
        propertyId,
        userId,
        role,
        active: true,
      },
    });
  }

  revalidatePath(
    `/properties/${propertyId}/edit`,
  );

  revalidatePath(
    `/properties/${propertyId}`,
  );
}
