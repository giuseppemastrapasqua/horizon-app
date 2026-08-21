import type {
  Prisma,
} from "@prisma/client";

export type StoredChannelPricingConfig = {
  commissionPercent: number | null;
};

export function getChannelPricingConfig(
  value: Prisma.JsonValue | null,
): StoredChannelPricingConfig {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {
      commissionPercent: null,
    };
  }

  const pricing =
    value["pricing"];

  if (
    !pricing ||
    typeof pricing !== "object" ||
    Array.isArray(pricing)
  ) {
    return {
      commissionPercent: null,
    };
  }

  const commissionPercent =
    pricing["commissionPercent"];

  if (
    typeof commissionPercent !==
      "number" ||
    !Number.isFinite(
      commissionPercent,
    ) ||
    commissionPercent < 0 ||
    commissionPercent >= 100
  ) {
    return {
      commissionPercent: null,
    };
  }

  return {
    commissionPercent,
  };
}
