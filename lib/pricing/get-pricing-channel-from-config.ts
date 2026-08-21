import type {
  Prisma,
} from "@prisma/client";

import type {
  PricingChannel,
} from "./channel-pricing";

export function getPricingChannelFromConfig(
  value: Prisma.JsonValue | null,
): PricingChannel | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const channel =
    value["channel"];

  switch (channel) {
    case "BOOKING":
      return "BOOKING";

    case "AIRBNB":
      return "AIRBNB";

    case "VRBO":
      return "VRBO";

    case "DIRECT":
      return "HORIZON";

    default:
      return null;
  }
}
