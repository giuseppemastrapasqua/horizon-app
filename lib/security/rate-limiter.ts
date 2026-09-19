import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export function createRateLimitKey(
  scope: string,
  identifier: string,
): string {
  const digest = createHash("sha256")
    .update(identifier)
    .digest("hex");

  return `${scope}:${digest}`;
}
type ConsumeRateLimitInput = {
  key: string;
  limit: number;
  windowSeconds: number;
};

type RateLimitRow = {
  count: number;
  expiresAt: Date;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export async function consumeRateLimit({
  key,
  limit,
  windowSeconds,
}: ConsumeRateLimitInput): Promise<RateLimitResult> {
  if (!key.trim()) {
    throw new Error("Rate limit key non valida.");
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error("Rate limit non valido.");
  }

  if (
    !Number.isInteger(windowSeconds) ||
    windowSeconds <= 0
  ) {
    throw new Error("Rate limit window non valida.");
  }
  const rows = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "RateLimitBucket" (
      "key",
      "count",
      "windowStart",
      "expiresAt",
      "createdAt",
      "updatedAt"
    )
    VALUES (
      ${key},
      1,
      NOW(),
      NOW() + (${windowSeconds} * INTERVAL '1 second'),
      NOW(),
      NOW()
    )
    ON CONFLICT ("key") DO UPDATE
    SET
      "count" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= NOW()
          THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= NOW()
          THEN NOW()
        ELSE "RateLimitBucket"."windowStart"
      END,
      "expiresAt" = CASE
        WHEN "RateLimitBucket"."expiresAt" <= NOW()
          THEN NOW() + (${windowSeconds} * INTERVAL '1 second')
        ELSE "RateLimitBucket"."expiresAt"
      END,
      "updatedAt" = NOW()
    RETURNING "count", "expiresAt";
  `;

  const bucket = rows[0];

  if (!bucket) {
    throw new Error("Impossibile aggiornare il rate limit.");
  }

  const allowed = bucket.count <= limit;
  const remaining = Math.max(0, limit - bucket.count);

  const retryAfterSeconds = allowed
    ? 0
    : Math.max(
        1,
        Math.ceil(
          (bucket.expiresAt.getTime() - Date.now()) / 1000,
        ),
      );

  return {
    allowed,
    remaining,
    retryAfterSeconds,
  };
}