"use server";

import { PropertyAccessRole, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRoles } from "@/lib/auth/guards";
import { createOperatorInviteToken } from "@/lib/auth/property-operator-invite-token";
import { sendEmail } from "@/lib/notifications/email/send-email";
import { prisma } from "@/lib/prisma";

const createInviteSchema = z.object({
  propertyId: z.string().min(1),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40).optional(),
});

function revalidateProperty(propertyId: string) {
  revalidatePath(`/properties/${propertyId}/edit`);
  revalidatePath(`/properties/${propertyId}`);
}

function getBaseUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL non configurata.",
    );
  }

  return "http://localhost:3000";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendOperatorInviteEmail({
  email,
  fullName,
  propertyName,
  invitePath,
}: {
  email: string;
  fullName: string;
  propertyName: string;
  invitePath: string;
}) {
  const inviteUrl =
    `${getBaseUrl()}${invitePath}`;

  await sendEmail({
    to: email,
    subject: "Horizon - Invito collaboratore",
    html: `
      <p>Ciao ${escapeHtml(fullName)},</p>
      <p>
        sei stato invitato come collaboratore operativo
        per la struttura
        <strong>${escapeHtml(propertyName)}</strong>.
      </p>
      <p>
        Per attivare il tuo accesso Horizon e creare
        la password, apri il seguente link:
      </p>
      <p>
        <a href="${escapeHtml(inviteUrl)}">
          Attiva il tuo accesso
        </a>
      </p>
      <p>
        Se non hai richiesto questo accesso,
        puoi ignorare questa email.
      </p>
    `,
  });
}

export async function createPropertyOperatorInviteAction(
  formData: FormData,
) {
  await requireRoles(["SUPER_ADMIN"]);

  const parsed = createInviteSchema.safeParse({
    propertyId: String(formData.get("propertyId") || ""),
    fullName: String(formData.get("fullName") || ""),
    email: String(formData.get("email") || "")
      .trim()
      .toLowerCase(),
    phone:
      String(formData.get("phone") || "").trim() ||
      undefined,
  });

  if (!parsed.success) {
    throw new Error(
      "Dati dell'invito collaboratore non validi.",
    );
  }

  const {
    propertyId,
    fullName,
    email,
    phone,
  } = parsed.data;

  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  const existingPendingInvite =
    await prisma.propertyOperatorInvite.findFirst({
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
      "Esiste già un invito collaboratore attivo per questa email e questa struttura.",
    );
  }

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        role: true,
      },
    });

  if (
    existingUser &&
    existingUser.role !== UserRole.OPERATOR
  ) {
    throw new Error(
      "Questa email appartiene già a un account Horizon con un ruolo diverso da collaboratore operativo.",
    );
  }

  if (existingUser) {
    const existingOperatorAccess =
      await prisma.propertyAccess.findFirst({
        where: {
          propertyId,
          userId: existingUser.id,
          role: PropertyAccessRole.OPERATOR,
          active: true,
        },
        select: {
          id: true,
        },
      });

    if (existingOperatorAccess) {
      throw new Error(
        "Questo collaboratore ha già accesso attivo alla struttura.",
      );
    }
  }

  const {
    token,
    tokenHash,
    expiresAt,
  } = createOperatorInviteToken();

  const invite =
    await prisma.propertyOperatorInvite.create({
      data: {
        propertyId,
        fullName,
        email,
        phone: phone || null,
        tokenHash,
        expiresAt,
      },
      select: {
        id: true,
        expiresAt: true,
      },
    });

  const invitePath =
    `/invite/operator/${token}`;

  let emailSent = true;

  try {
    await sendOperatorInviteEmail({
      email,
      fullName,
      propertyName: property.name,
      invitePath,
    });
  } catch (error) {
    emailSent = false;

    console.error(
      "Invio email invito collaboratore fallito.",
      error,
    );
  }

  revalidateProperty(propertyId);

  return {
    inviteId: invite.id,
    invitePath,
    expiresAt: invite.expiresAt,
    emailSent,
  };
}

export async function resendPropertyOperatorInviteAction(
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
    await prisma.propertyOperatorInvite.findFirst({
      where: {
        id: inviteId,
        propertyId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        acceptedAt: true,
        revokedAt: true,
        property: {
          select: {
            name: true,
          },
        },
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

  const {
    token,
    tokenHash,
    expiresAt,
  } = createOperatorInviteToken();

  await prisma.propertyOperatorInvite.update({
    where: {
      id: inviteId,
    },
    data: {
      tokenHash,
      expiresAt,
    },
  });

  const invitePath =
    `/invite/operator/${token}`;

  let emailSent = true;

  try {
    await sendOperatorInviteEmail({
      email: invite.email,
      fullName: invite.fullName,
      propertyName: invite.property.name,
      invitePath,
    });
  } catch (error) {
    emailSent = false;

    console.error(
      "Reinvio email collaboratore fallito.",
      error,
    );
  }

  revalidateProperty(propertyId);

  return {
    inviteId,
    invitePath,
    expiresAt,
    emailSent,
  };
}

export async function revokePropertyOperatorInviteAction(
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
    await prisma.propertyOperatorInvite.updateMany({
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

export async function revokeAcceptedOperatorAccessAction(
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

  const invite =
    await prisma.propertyOperatorInvite.findFirst({
      where: {
        id: inviteId,
        propertyId,
        acceptedAt: {
          not: null,
        },
        revokedAt: null,
      },
      select: {
        email: true,
      },
    });

  if (!invite) {
    throw new Error(
      "Invito collaboratore accettato non trovato.",
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email: invite.email.trim().toLowerCase(),
      },
      select: {
        id: true,
        role: true,
      },
    });

  if (!user) {
    throw new Error(
      "Utente collaboratore non trovato.",
    );
  }

  if (user.role !== UserRole.OPERATOR) {
    throw new Error(
      "L'account associato non è un collaboratore operativo.",
    );
  }

  const revokedAt = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.propertyAccess.updateMany({
      where: {
        propertyId,
        userId: user.id,
        role: PropertyAccessRole.OPERATOR,
        active: true,
      },
      data: {
        active: false,
      },
    });

    const inviteResult =
      await tx.propertyOperatorInvite.updateMany({
        where: {
          id: inviteId,
          propertyId,
          acceptedAt: {
            not: null,
          },
          revokedAt: null,
        },
        data: {
          revokedAt,
        },
      });

    if (inviteResult.count !== 1) {
      throw new Error(
        "Accesso collaboratore già revocato o non più valido.",
      );
    }
  });

  revalidateProperty(propertyId);
}