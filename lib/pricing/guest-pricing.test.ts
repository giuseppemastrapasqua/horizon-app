import {
  describe,
  expect,
  it,
} from "vitest";
import {
  buildGuestPrice,
} from "./guest-pricing";

describe(
  "buildGuestPrice",
  () => {
    it(
      "mantiene il prezzo base per 1 ospite",
      () => {
        const result =
          buildGuestPrice({
            baseRevenuePrice: 175,
            guestCount: 1,
            baseGuests: 2,
            maxGuests: 6,
            extraGuestFee: 20,
          });

        expect(
          result.guestAdjustedRevenuePrice,
        ).toBe(175);

        expect(
          result.extraGuests,
        ).toBe(0);
      },
    );

    it(
      "mantiene il prezzo base per 2 ospiti",
      () => {
        const result =
          buildGuestPrice({
            baseRevenuePrice: 175,
            guestCount: 2,
            baseGuests: 2,
            maxGuests: 6,
            extraGuestFee: 20,
          });

        expect(
          result.guestAdjustedRevenuePrice,
        ).toBe(175);

        expect(
          result.extraGuestAmount,
        ).toBe(0);
      },
    );

    it(
      "aggiunge un supplemento dal terzo ospite",
      () => {
        const result =
          buildGuestPrice({
            baseRevenuePrice: 175,
            guestCount: 3,
            baseGuests: 2,
            maxGuests: 6,
            extraGuestFee: 20,
          });

        expect(
          result.extraGuests,
        ).toBe(1);

        expect(
          result.extraGuestAmount,
        ).toBe(20);

        expect(
          result.guestAdjustedRevenuePrice,
        ).toBe(195);
      },
    );

    it(
      "applica il supplemento a tutti gli ospiti oltre i 2 inclusi",
      () => {
        const result =
          buildGuestPrice({
            baseRevenuePrice: 175,
            guestCount: 6,
            baseGuests: 2,
            maxGuests: 6,
            extraGuestFee: 20,
          });

        expect(
          result.extraGuests,
        ).toBe(4);

        expect(
          result.extraGuestAmount,
        ).toBe(80);

        expect(
          result.guestAdjustedRevenuePrice,
        ).toBe(255);
      },
    );

    it(
      "mantiene precisione monetaria a due decimali",
      () => {
        const result =
          buildGuestPrice({
            baseRevenuePrice: 175.25,
            guestCount: 4,
            baseGuests: 2,
            maxGuests: 6,
            extraGuestFee: 12.35,
          });

        expect(
          result.guestAdjustedRevenuePrice,
        ).toBe(199.95);
      },
    );

    it(
      "rifiuta un numero di ospiti superiore alla capienza",
      () => {
        expect(() =>
          buildGuestPrice({
            baseRevenuePrice: 175,
            guestCount: 7,
            baseGuests: 2,
            maxGuests: 6,
            extraGuestFee: 20,
          }),
        ).toThrow(
          "Il numero di ospiti supera la capienza massima della struttura.",
        );
      },
    );

    it(
      "rifiuta supplementi negativi",
      () => {
        expect(() =>
          buildGuestPrice({
            baseRevenuePrice: 175,
            guestCount: 3,
            baseGuests: 2,
            maxGuests: 6,
            extraGuestFee: -1,
          }),
        ).toThrow(
          "extraGuestFee non valido.",
        );
      },
    );
  },
);