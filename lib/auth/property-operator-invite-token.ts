import { createHash, randomBytes } from "node:crypto";

const OPERATOR_INVITE_TOKEN_BYTES = 32;

export const OPERATOR_INVITE_VALIDITY_HOURS = 48;

export function hashOperatorInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createOperatorInviteToken(now = new Date()) {
  const token = randomBytes(OPERATOR_INVITE_TOKEN_BYTES).toString("hex");

  return {
    token,
    tokenHash: hashOperatorInviteToken(token),
    expiresAt: new Date(
      now.getTime() + OPERATOR_INVITE_VALIDITY_HOURS * 60 * 60 * 1000,
    ),
  };
}

export function isOperatorInviteUsable(
  invite: {
    expiresAt: Date;
    acceptedAt: Date | null;
    revokedAt: Date | null;
  },
  now = new Date(),
) {
  return (
    invite.acceptedAt === null &&
    invite.revokedAt === null &&
    invite.expiresAt.getTime() > now.getTime()
  );
}