import { createHash, randomBytes } from "node:crypto";

const OWNER_INVITE_TOKEN_BYTES = 32;

export const OWNER_INVITE_VALIDITY_HOURS = 48;

export function hashOwnerInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createOwnerInviteToken(now = new Date()) {
  const token = randomBytes(OWNER_INVITE_TOKEN_BYTES).toString("hex");

  return {
    token,
    tokenHash: hashOwnerInviteToken(token),
    expiresAt: new Date(
      now.getTime() + OWNER_INVITE_VALIDITY_HOURS * 60 * 60 * 1000,
    ),
  };
}

export function isOwnerInviteUsable(
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