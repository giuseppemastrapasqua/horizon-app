import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildChannelPrice,
  buildChannelPrices,
} from "./channel-pricing";

describe(
  "channel pricing",
  () => {
    it(
      "preserva il Revenue AI dopo una commissione percentuale",
      () => {
        const result =
          buildChannelPrice({
            baseRevenuePrice: 200,
            config: {
              channel: "BOOKING",
              commissionPercent: 20,
            },
          });

        expect(
          result.status,
        ).toBe(
          "CONFIGURED",
        );

        if (
          result.status !==
          "CONFIGURED"
        ) {
          throw new Error(
            "Risultato non configurato.",
          );
        }

        expect(
          result.recommendedChannelPrice,
        ).toBe(
          250,
        );

        expect(
          result.estimatedCommission,
        ).toBe(
          50,
        );

        expect(
          result.estimatedNetRevenue,
        ).toBe(
          200,
        );
      },
    );

    it(
      "non inventa un prezzo senza commissione",
      () => {
        const result =
          buildChannelPrice({
            baseRevenuePrice: 200,
            config: {
              channel: "AIRBNB",
              commissionPercent: null,
            },
          });

        expect(
          result.status,
        ).toBe(
          "NOT_CONFIGURED",
        );
      },
    );

    it(
      "gestisce Booking Airbnb Vrbo e Horizon",
      () => {
        const results =
          buildChannelPrices({
            baseRevenuePrice: 200,
            configs: [
              {
                channel: "BOOKING",
                commissionPercent: 20,
              },
              {
                channel: "AIRBNB",
                commissionPercent: null,
              },
              {
                channel: "VRBO",
                commissionPercent: null,
              },
              {
                channel: "HORIZON",
                commissionPercent: null,
              },
            ],
          });

        expect(
          results.map(
            (result) =>
              result.channel,
          ),
        ).toEqual([
          "BOOKING",
          "AIRBNB",
          "VRBO",
          "HORIZON",
        ]);
      },
    );
  },
);