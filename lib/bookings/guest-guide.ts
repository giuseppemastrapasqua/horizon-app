import { createHmac, timingSafeEqual } from "node:crypto";

export const DUOMO_BOUTIQUE_PROPERTY_ID = "cmtla6csd0002d9u8dxd5bray";

export function createGuestGuideReceipt(tokenHash: string, submittedAt: Date) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret)
    .update(`horizon-guest-guide:v1:${tokenHash}:${submittedAt.getTime()}`)
    .digest("base64url");
}

export function verifyGuestGuideReceipt(
  receipt: string | null,
  tokenHash: string,
  link: { revokedAt: Date | null; expiresAt: Date },
) {
  if (!receipt || !/^[A-Za-z0-9_-]{43}$/.test(receipt) ||
      !link.revokedAt || link.expiresAt.getTime() <= Date.now()) return false;
  const expected = createGuestGuideReceipt(tokenHash, link.revokedAt);
  return Boolean(expected && timingSafeEqual(Buffer.from(receipt), Buffer.from(expected)));
}
