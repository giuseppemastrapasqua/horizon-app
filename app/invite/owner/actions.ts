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

  return result;
}