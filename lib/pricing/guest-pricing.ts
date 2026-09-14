export type BuildGuestPriceInput = {
  baseRevenuePrice: number;
  guestCount: number;
  baseGuests: number;
  maxGuests: number;
  extraGuestFee: number;
};

export type GuestPricingResult = {
  baseRevenuePrice: number;
  guestCount: number;
  baseGuests: number;
  extraGuests: number;
  extraGuestFee: number;
  extraGuestAmount: number;
  guestAdjustedRevenuePrice: number;
};

export function buildGuestPrice({
  baseRevenuePrice,
  guestCount,
  baseGuests,
  maxGuests,
  extraGuestFee,
}: BuildGuestPriceInput): GuestPricingResult {
  validateGuestPricingInput({
    baseRevenuePrice,
    guestCount,
    baseGuests,
    maxGuests,
    extraGuestFee,
  });

  const extraGuests = Math.max(
    0,
    guestCount - baseGuests,
  );

  const extraGuestAmount = roundMoney(
    extraGuests * extraGuestFee,
  );

  const guestAdjustedRevenuePrice =
    roundMoney(
      baseRevenuePrice +
        extraGuestAmount,
    );

  return {
    baseRevenuePrice:
      roundMoney(baseRevenuePrice),
    guestCount,
    baseGuests,
    extraGuests,
    extraGuestFee:
      roundMoney(extraGuestFee),
    extraGuestAmount,
    guestAdjustedRevenuePrice,
  };
}

function validateGuestPricingInput({
  baseRevenuePrice,
  guestCount,
  baseGuests,
  maxGuests,
  extraGuestFee,
}: BuildGuestPriceInput) {
  if (
    !Number.isFinite(baseRevenuePrice) ||
    baseRevenuePrice < 0
  ) {
    throw new Error(
      "baseRevenuePrice non valido.",
    );
  }

  if (
    !Number.isInteger(guestCount) ||
    guestCount < 1
  ) {
    throw new Error(
      "guestCount non valido.",
    );
  }

  if (
    !Number.isInteger(baseGuests) ||
    baseGuests < 1
  ) {
    throw new Error(
      "baseGuests non valido.",
    );
  }

  if (
    !Number.isInteger(maxGuests) ||
    maxGuests < baseGuests
  ) {
    throw new Error(
      "maxGuests non valido.",
    );
  }

  if (guestCount > maxGuests) {
    throw new Error(
      "Il numero di ospiti supera la capienza massima della struttura.",
    );
  }

  if (
    !Number.isFinite(extraGuestFee) ||
    extraGuestFee < 0
  ) {
    throw new Error(
      "extraGuestFee non valido.",
    );
  }
}

function roundMoney(
  value: number,
) {
  return (
    Math.round(value * 100) /
    100
  );
}