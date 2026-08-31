"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRoles } from "@/lib/auth/guards";
import { createOwnerInviteToken } from "@/lib/auth/property-owner-invite-token";
import { prisma } from "@/lib/prisma";

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