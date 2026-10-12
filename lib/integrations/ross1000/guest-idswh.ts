import { createHash } from "node:crypto";

const ROSS1000_IDSWH_LENGTH = 20;
const ROSS1000_IDSWH_PREFIX = "H";

export function buildRoss1000GuestIdswh(
  bookingGuestId: string,
): string {
  const normalizedId = bookingGuestId.trim();

  if (!normalizedId) {
    throw new Error(
      "ROSS1000: identificativo interno ospite obbligatorio.",
    );
  }

  const digest = createHash("sha256")
    .update(`horizon:ross1000:guest:${normalizedId}`, "utf8")
    .digest("hex");

  return (
    ROSS1000_IDSWH_PREFIX +
    digest.slice(
      0,
      ROSS1000_IDSWH_LENGTH -
        ROSS1000_IDSWH_PREFIX.length,
    )
  );
}
