import { createHash, randomBytes } from "node:crypto";

const LINK_VALID_AFTER_CHECKOUT_MS = 24 * 60 * 60 * 1000;

export function generateGuestCheckInToken() {
  return randomBytes(32).toString("base64url");
}

export function hashGuestCheckInToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function calculateGuestCheckInLinkExpiry(checkOut: Date) {
  return new Date(checkOut.getTime() + LINK_VALID_AFTER_CHECKOUT_MS);
}

export function isGuestCheckInLinkUsable(input: {
  expiresAt: Date;
  revokedAt: Date | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();

  return input.revokedAt === null && input.expiresAt.getTime() > now.getTime();
}
