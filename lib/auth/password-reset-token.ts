import { createHash, randomBytes } from "node:crypto";

const PASSWORD_RESET_TOKEN_BYTES = 32;

export const PASSWORD_RESET_VALIDITY_MINUTES = 30;

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken(now = new Date()) {
  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("hex");

  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(
      now.getTime() + PASSWORD_RESET_VALIDITY_MINUTES * 60 * 1000,
    ),
  };
}

export function isPasswordResetTokenUsable(
  resetToken: {
    expiresAt: Date;
    usedAt: Date | null;
  },
  now = new Date(),
) {
  return (
    resetToken.usedAt === null &&
    resetToken.expiresAt.getTime() > now.getTime()
  );
}
