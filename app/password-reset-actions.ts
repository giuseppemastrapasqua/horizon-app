"use server";

import { hash } from "bcryptjs";

import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetTokenUsable,
} from "@/lib/auth/password-reset-token";
import { sendEmail } from "@/lib/notifications/email/send-email";
import { prisma } from "@/lib/prisma";

const PASSWORD_MIN_LENGTH = 10;
const PASSWORD_MAX_LENGTH = 128;
const REQUEST_COOLDOWN_SECONDS = 60;

const REQUEST_SUCCESS_MESSAGE =
  "Se esiste un account associato a questa email, riceverai un link per reimpostare la password.";

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

export async function requestPasswordResetAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));

  if (!isValidEmail(email)) {
    return {
      success: true as const,
      message: REQUEST_SUCCESS_MESSAGE,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      status: true,
      passwordHash: true,
    },
  });

  if (
    !user ||
    user.status !== "ACTIVE" ||
    !user.passwordHash
  ) {
    return {
      success: true as const,
      message: REQUEST_SUCCESS_MESSAGE,
    };
  }

  const cooldownThreshold = new Date(
    Date.now() - REQUEST_COOLDOWN_SECONDS * 1000,
  );

  const recentToken =
    await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        createdAt: {
          gt: cooldownThreshold,
        },
      },
      select: {
        id: true,
      },
    });

  if (recentToken) {
    return {
      success: true as const,
      message: REQUEST_SUCCESS_MESSAGE,
    };
  }

  const resetToken = createPasswordResetToken();

  const createdToken =
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: resetToken.tokenHash,
        expiresAt: resetToken.expiresAt,
      },
      select: {
        id: true,
      },
    });

  try {
    const resetUrl = new URL(
      `/reset-password/${resetToken.token}`,
      getBaseUrl(),
    ).toString();

    await sendEmail({
      to: email,
      subject: "Horizon · Reimposta la password",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
          <div style="padding:24px 0;border-bottom:1px solid #e2e8f0">
            <div style="font-size:22px;font-weight:800;color:#2563eb">
              Horizon
            </div>
            <div style="margin-top:4px;font-size:12px;color:#64748b">
              Reimpostazione password
            </div>
          </div>

          <div style="padding:28px 0">
            <h1 style="margin:0;font-size:24px;line-height:1.25">
              Reimposta la tua password
            </h1>

            <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#475569">
              Abbiamo ricevuto una richiesta di reimpostazione della password del tuo account Horizon.
            </p>

            <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#475569">
              Il link è personale, utilizzabile una sola volta e scade tra 30 minuti.
            </p>

            <a
              href="${resetUrl}"
              style="display:inline-block;margin-top:24px;padding:12px 18px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-size:14px;font-weight:700"
            >
              Reimposta password
            </a>

            <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#64748b">
              Se non hai richiesto tu questa modifica, puoi ignorare questa email. La password attuale resterà invariata.
            </p>
          </div>

          <div style="padding:18px 0;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8">
            Horizon Property Management OS
          </div>
        </div>
      `,
    });
  } catch (error) {
    await prisma.passwordResetToken.deleteMany({
      where: {
        id: createdToken.id,
      },
    });

    console.error("Invio email password reset fallito.", error);
  }

  return {
    success: true as const,
    message: REQUEST_SUCCESS_MESSAGE,
  };
}

export async function resetPasswordAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(
    formData.get("confirmPassword") ?? "",
  );

  if (!token) {
    throw new Error("Link di reimpostazione non valido o scaduto.");
  }

  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    throw new Error(
      `La password deve contenere tra ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caratteri.`,
    );
  }

  if (password !== confirmPassword) {
    throw new Error("Le password non coincidono.");
  }

  const tokenHash = hashPasswordResetToken(token);

  const resetToken =
    await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });

  if (
    !resetToken ||
    resetToken.user.status !== "ACTIVE" ||
    !isPasswordResetTokenUsable(resetToken)
  ) {
    throw new Error("Link di reimpostazione non valido o scaduto.");
  }

  const passwordHash = await hash(password, 12);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const consumed =
      await tx.passwordResetToken.updateMany({
        where: {
          id: resetToken.id,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      });

    if (consumed.count !== 1) {
      throw new Error(
        "Link di reimpostazione non valido o scaduto.",
      );
    }

    await tx.user.update({
      where: {
        id: resetToken.userId,
      },
      data: {
        passwordHash,
      },
    });

    await tx.passwordResetToken.updateMany({
      where: {
        userId: resetToken.userId,
        usedAt: null,
      },
      data: {
        usedAt: now,
      },
    });
  });

  return {
    success: true as const,
  };
}
