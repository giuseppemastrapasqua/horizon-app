"use server";

import {
  PropertyAccessRole,
  RecordStatus,
  UserRole,
} from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";

import {
  hashOwnerInviteToken,
  isOwnerInviteUsable,
} from "@/lib/auth/property-owner-invite-token";
import { sendEmail } from "@/lib/notifications/email/send-email";
import { prisma } from "@/lib/prisma";

const acceptInviteSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(10).max(128),
    confirmPassword: z.string().min(1),
  })
  .refine(
    (values) =>
      values.password === values.confirmPassword,
    {
      message: "Le password non coincidono.",
      path: ["confirmPassword"],
    },
  );

function getBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return new URL(configuredUrl).origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL non configurata.");
  }

  return "http://localhost:3000";
}

export async function acceptPropertyOwnerInviteAction(
  formData: FormData,
) {
  const parsed = acceptInviteSchema.safeParse({
    token: String(formData.get("token") || ""),
    password: String(formData.get("password") || ""),
    confirmPassword: String(
      formData.get("confirmPassword") || "",
    ),
  });

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ||
        "Dati di attivazione non validi.",
    );
  }

  const { token, password } = parsed.data;
  const tokenHash = hashOwnerInviteToken(token);
  const now = new Date();

  const invite =
    await prisma.propertyOwnerInvite.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        propertyId: true,
        email: true,
        fullName: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
      },
    });

  if (!invite || !isOwnerInviteUsable(invite, now)) {
    throw new Error(
      "Invito non valido, scaduto o già utilizzato.",
    );
  }

  const passwordHash = await hash(password, 12);

  const result = await prisma.$transaction(
    async (transaction) => {
      const currentInvite =
        await transaction.propertyOwnerInvite.findUnique({
          where: {
            id: invite.id,
          },
          select: {
            id: true,
            propertyId: true,
            email: true,
            fullName: true,
            expiresAt: true,
            acceptedAt: true,
            revokedAt: true,
          },
        });

      if (
        !currentInvite ||
        !isOwnerInviteUsable(currentInvite, now)
      ) {
        throw new Error(
          "Invito non valido, scaduto o già utilizzato.",
        );
      }

      const existingUser =
        await transaction.user.findUnique({
          where: {
            email: currentInvite.email,
          },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            passwordHash: true,
          },
        });


if (existingUser?.role === UserRole.SUPER_ADMIN) {
        throw new Error(
          "Il Super Admin dispone già di accesso globale e non può accettare un invito proprietario.",
        );
      }

      if (
        existingUser &&
        existingUser.role !== UserRole.OWNER
      ) {
        throw new Error(
          "L'account associato a questa email non è un account proprietario e richiede una verifica amministrativa.",
        );
      }

      let userId: string;

      if (!existingUser) {
        const user = await transaction.user.create({
          data: {
            fullName: currentInvite.fullName,
            email: currentInvite.email,
            role: UserRole.OWNER,
            status: RecordStatus.ACTIVE,
            passwordHash,
          },
          select: {
            id: true,
          },
        });

        userId = user.id;
      } else {
        if (
          existingUser.status ===
            RecordStatus.SUSPENDED ||
          existingUser.status ===
            RecordStatus.ARCHIVED ||
          (existingUser.status ===
            RecordStatus.INACTIVE &&
            existingUser.passwordHash)
        ) {
          throw new Error(
            "L'account associato a questa email richiede una verifica amministrativa.",
          );
        }

        userId = existingUser.id;

        if (!existingUser.passwordHash) {
          await transaction.user.update({
            where: {
              id: existingUser.id,
            },
            data: {
              passwordHash,
              status: RecordStatus.ACTIVE,
            },
          });
        }
      }

      await transaction.propertyAccess.upsert({
        where: {
          propertyId_userId: {
            propertyId: currentInvite.propertyId,
            userId,
          },
        },
        update: {
          role: PropertyAccessRole.OWNER,
          active: true,
        },
        create: {
          propertyId: currentInvite.propertyId,
          userId,
          role: PropertyAccessRole.OWNER,
          active: true,
        },
      });

      const accepted =
        await transaction.propertyOwnerInvite.updateMany({
          where: {
            id: currentInvite.id,
            acceptedAt: null,
            revokedAt: null,
            expiresAt: {
              gt: now,
            },
          },
          data: {
            acceptedAt: now,
          },
        });

      if (accepted.count !== 1) {
        throw new Error(
          "Invito non valido, scaduto o già utilizzato.",
        );
      }

      return {
        userId,
        email: currentInvite.email,
      };
    },
  );

  try {
    const loginUrl = new URL("/login", getBaseUrl()).toString();

    await sendEmail({
      to: result.email,
      subject: "Horizon - Accesso attivato",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
          <div style="padding:24px 0;border-bottom:1px solid #e2e8f0">
            <div style="font-size:22px;font-weight:800;color:#2563eb">Horizon</div>
            <div style="margin-top:4px;font-size:12px;color:#64748b">Accesso proprietario attivato</div>
          </div>

          <div style="padding:28px 0">
            <h1 style="margin:0;font-size:24px;line-height:1.25">Il tuo accesso e attivo</h1>

            <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#475569">
              Il tuo accesso proprietario a Horizon e stato attivato correttamente.
            </p>

            <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#475569">
              Email di accesso: <strong>${result.email}</strong>
            </p>

            <a href="${loginUrl}" style="display:inline-block;margin-top:24px;padding:12px 18px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-size:14px;font-weight:700">
              Accedi a Horizon
            </a>
          </div>

          <div style="padding:18px 0;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8">
            Horizon Property Management OS
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error("Invio email attivazione owner fallito.", error);
  }

  return result;
}
