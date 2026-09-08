"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRoles } from "@/lib/auth/guards";
import { createOwnerInviteToken } from "@/lib/auth/property-owner-invite-token";
import { prisma } from "@/lib/prisma";

const ownerBillingProfileSchema = z.object({
  propertyId: z.string().min(1),
  entityType: z.enum(["PRIVATE", "VAT_REGISTERED"]),
  firstName: z.string().trim().max(120).optional(),
  lastName: z.string().trim().max(120).optional(),
  businessName: z.string().trim().max(160).optional(),
  taxCode: z.string().trim().max(32).optional(),
  vatNumber: z.string().trim().max(32).optional(),
  address: z.string().trim().min(2).max(200),
  postalCode: z.string().trim().min(2).max(20),
  city: z.string().trim().min(2).max(120),
  province: z.string().trim().max(80).optional(),
  country: z.string().trim().min(2).max(2).default("IT"),
  email: z.string().trim().email(),
  pec: z.string().trim().email().optional().or(z.literal("")),
  recipientCode: z.string().trim().max(20).optional(),
}).superRefine((data, ctx) => {
  if (data.entityType === "PRIVATE") {
    if (!data.firstName) ctx.addIssue({ code: "custom", path: ["firstName"], message: "Nome obbligatorio." });
    if (!data.lastName) ctx.addIssue({ code: "custom", path: ["lastName"], message: "Cognome obbligatorio." });
    if (!data.taxCode) ctx.addIssue({ code: "custom", path: ["taxCode"], message: "Codice fiscale obbligatorio." });
  }

  if (data.entityType === "VAT_REGISTERED") {
    if (!data.businessName) ctx.addIssue({ code: "custom", path: ["businessName"], message: "Ragione sociale obbligatoria." });
    if (!data.vatNumber) ctx.addIssue({ code: "custom", path: ["vatNumber"], message: "Partita IVA obbligatoria." });
  }
});
const createInviteSchema = z.object({
  propertyId: z.string().min(1),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
});

function revalidateProperty(propertyId: string) {
  revalidatePath(`/properties/${propertyId}/edit`);
  revalidatePath(`/properties/${propertyId}`);
}

export async function createPropertyOwnerInviteAction(
  formData: FormData,
) {
  await requireRoles(["SUPER_ADMIN"]);

  const parsed = createInviteSchema.safeParse({
    propertyId: String(formData.get("propertyId") || ""),
    fullName: String(formData.get("fullName") || ""),
    email: String(formData.get("email") || "")
      .trim()
      .toLowerCase(),
  });

  if (!parsed.success) {
    throw new Error("Dati dell'invito non validi.");
  }

  const { propertyId, fullName, email } = parsed.data;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true },
  });

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  const existingPendingInvite =
    await prisma.propertyOwnerInvite.findFirst({
      where: {
        propertyId,
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

  if (existingPendingInvite) {
    throw new Error(
      "Esiste già un invito attivo per questa email e questa struttura.",
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      role: true,
    },
  });

  if (existingUser?.role === "SUPER_ADMIN") {
    throw new Error(
      "Il Super Admin dispone già di accesso globale e non può essere invitato come proprietario.",
    );
  }

  if (existingUser) {
    const existingOwnerAccess =
      await prisma.propertyAccess.findFirst({
        where: {
          propertyId,
          userId: existingUser.id,
          role: "OWNER",
          active: true,
        },
        select: { id: true },
      });

    if (existingOwnerAccess) {
      throw new Error(
        "Questo proprietario ha già accesso attivo alla struttura.",
      );
    }
  }

  const { token, tokenHash, expiresAt } =
    createOwnerInviteToken();

  const invite = await prisma.propertyOwnerInvite.create({
    data: {
      propertyId,
      fullName,
      email,
      tokenHash,
      expiresAt,
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  revalidateProperty(propertyId);

  return {
    inviteId: invite.id,
    invitePath: `/invite/owner/${token}`,
    expiresAt: invite.expiresAt,
  };
}

export async function revokePropertyOwnerInviteAction(
  formData: FormData,
): Promise<void> {
  await requireRoles(["SUPER_ADMIN"]);

  const propertyId = String(
    formData.get("propertyId") || "",
  );

  const inviteId = String(
    formData.get("inviteId") || "",
  );

  if (!propertyId || !inviteId) {
    throw new Error("Invito non specificato.");
  }

  const result =
    await prisma.propertyOwnerInvite.updateMany({
      where: {
        id: inviteId,
        propertyId,
        acceptedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

  if (result.count !== 1) {
    throw new Error(
      "Invito non trovato, già revocato o già accettato.",
    );
  }

  revalidateProperty(propertyId);
}

export async function revokeAcceptedOwnerAccessAction(
  formData: FormData,
): Promise<void> {
  await requireRoles(["SUPER_ADMIN"]);

  const propertyId = String(
    formData.get("propertyId") || "",
  );
  const inviteId = String(
    formData.get("inviteId") || "",
  );

  if (!propertyId || !inviteId) {
    throw new Error("Invito non specificato.");
  }

  const invite = await prisma.propertyOwnerInvite.findFirst({
    where: {
      id: inviteId,
      propertyId,
      acceptedAt: { not: null },
      revokedAt: null,
    },
    select: {
      email: true,
    },
  });

  if (!invite) {
    throw new Error("Invito accettato non trovato.");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: invite.email.trim().toLowerCase(),
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("Utente proprietario non trovato.");
  }

  if (user.role === "SUPER_ADMIN") {
    throw new Error(
      "Il Super Admin dispone di accesso globale e non puo essere revocato come proprietario.",
    );
  }

  const revokedAt = new Date();

  await prisma.$transaction([
    prisma.propertyAccess.updateMany({
      where: {
        propertyId,
        userId: user.id,
        role: "OWNER",
        active: true,
      },
      data: {
        active: false,
      },
    }),
    prisma.propertyOwnerInvite.updateMany({
      where: {
        id: inviteId,
        propertyId,
        acceptedAt: { not: null },
        revokedAt: null,
      },
      data: {
        revokedAt,
      },
    }),
  ]);

  revalidateProperty(propertyId);
}

export async function resendPropertyOwnerInviteAction(
  formData: FormData,
) {
  await requireRoles(["SUPER_ADMIN"]);

  const propertyId = String(
    formData.get("propertyId") || "",
  );

  const inviteId = String(
    formData.get("inviteId") || "",
  );

  if (!propertyId || !inviteId) {
    throw new Error("Invito non specificato.");
  }

  const invite =
    await prisma.propertyOwnerInvite.findFirst({
      where: {
        id: inviteId,
        propertyId,
      },
      select: {
        id: true,
        acceptedAt: true,
        revokedAt: true,
      },
    });

  if (!invite) {
    throw new Error("Invito non trovato.");
  }

  if (invite.acceptedAt) {
    throw new Error(
      "Un invito già accettato non può essere reinviato.",
    );
  }

  if (invite.revokedAt) {
    throw new Error(
      "Un invito revocato non può essere reinviato.",
    );
  }

  const { token, tokenHash, expiresAt } =
    createOwnerInviteToken();

  await prisma.propertyOwnerInvite.update({
    where: {
      id: inviteId,
    },
    data: {
      tokenHash,
      expiresAt,
    },
  });

  revalidateProperty(propertyId);

  return {
    inviteId,
    invitePath: `/invite/owner/${token}`,
    expiresAt,
  };
}
export async function deleteSuperAdminOwnerInviteAction(
  formData: FormData,
): Promise<void> {
  await requireRoles(["SUPER_ADMIN"]);

  const propertyId = String(
    formData.get("propertyId") || "",
  );
  const inviteId = String(
    formData.get("inviteId") || "",
  );

  if (!propertyId || !inviteId) {
    throw new Error("Invito non specificato.");
  }

  const invite = await prisma.propertyOwnerInvite.findFirst({
    where: {
      id: inviteId,
      propertyId,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!invite) {
    throw new Error("Invito non trovato.");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: invite.email.trim().toLowerCase(),
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user || user.role !== "SUPER_ADMIN") {
    throw new Error(
      "Questa pulizia è consentita solo per inviti associati a un Super Admin.",
    );
  }

  await prisma.$transaction([
    prisma.propertyOwnerInvite.deleteMany({
      where: {
        propertyId,
        email: invite.email,
      },
    }),
    prisma.propertyAccess.updateMany({
      where: {
        propertyId,
        userId: user.id,
        role: "OWNER",
        active: true,
      },
      data: {
        active: false,
      },
    }),
  ]);

  revalidateProperty(propertyId);
}

export async function upsertOwnerBillingProfileAction(
  formData: FormData,
): Promise<void> {
  await requireRoles(["SUPER_ADMIN"]);

  const parsed = ownerBillingProfileSchema.safeParse({
    propertyId: String(formData.get("propertyId") || ""),
    entityType: String(formData.get("entityType") || ""),
    firstName: String(formData.get("firstName") || "").trim() || undefined,
    lastName: String(formData.get("lastName") || "").trim() || undefined,
    businessName: String(formData.get("businessName") || "").trim() || undefined,
    taxCode: String(formData.get("taxCode") || "").trim().toUpperCase() || undefined,
    vatNumber: String(formData.get("vatNumber") || "").trim().toUpperCase() || undefined,
    address: String(formData.get("address") || ""),
    postalCode: String(formData.get("postalCode") || ""),
    city: String(formData.get("city") || ""),
    province: String(formData.get("province") || "").trim().toUpperCase() || undefined,
    country: String(formData.get("country") || "IT").trim().toUpperCase(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    pec: String(formData.get("pec") || "").trim().toLowerCase(),
    recipientCode: String(formData.get("recipientCode") || "").trim().toUpperCase() || undefined,
  });

  if (!parsed.success) {
    throw new Error("Dati fiscali del proprietario non validi.");
  }

  const property = await prisma.property.findUnique({
    where: { id: parsed.data.propertyId },
    select: { id: true, ownerId: true },
  });

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  const { propertyId, ...profile } = parsed.data;

  await prisma.ownerBillingProfile.upsert({
    where: { ownerId: property.ownerId },
    create: {
      ownerId: property.ownerId,
      ...profile,
      pec: profile.pec || null,
    },
    update: {
      ...profile,
      pec: profile.pec || null,
    },
  });

  revalidateProperty(propertyId);
}
