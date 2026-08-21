import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildDailyChannelPrices,
} from "./daily-channel-pricing";

describe(
  "daily channel pricing",
  () => {
    it(
      "calcola i prezzi canale per ogni notte Revenue AI",
      () => {
        const result =
          buildDailyChannelPrices({
            dailyPrices: [
              {
                date:
                  "2026-08-18",
                recommendedPrice:
                  174,
              },
              {
                date:
                  "2026-08-19",
                recommendedPrice:
                  182,
              },
            ],

            configs: [
              {
                channel:
                  "BOOKING",
                commissionPercent:
                  20,
              },
              {
                channel:
                  "HORIZON",
                commissionPercent:
                  0,
              },
            ],
          });

        expect(
          result,
        ).toHaveLength(
          2,
        );

        expect(
          result[0]
            .baseRevenuePrice,
        ).toBe(
          174,
        );

        expect(
          result[0]
            .channels[0]
            .recommendedChannelPrice,
        ).toBe(
          217.5,
        );

        expect(
          result[0]
            .channels[0]
            .estimatedCommission,
        ).toBe(
          43.5,
        );

        expect(
          result[0]
            .channels[0]
            .estimatedNetRevenue,
        ).toBe(
          174,
        );

        expect(
          result[0]
            .channels[1]
            .recommendedChannelPrice,
        ).toBe(
          174,
        );

        expect(
          result[1]
            .channels[0]
            .recommendedChannelPrice,
        ).toBe(
          227.5,
        );

        expect(
          result[1]
            .channels[0]
            .estimatedNetRevenue,
        ).toBe(
          182,
        );
      },
    );

    it(
      "mantiene non configurato un canale senza commissione",
      () => {
        const result =
          buildDailyChannelPrices({
            dailyPrices: [
              {
                date:
                  "2026-08-18",
                recommendedPrice:
                  174,
              },
            ],

            configs: [
              {
                channel:
                  "AIRBNB",
                commissionPercent:
                  null,
              },
            ],
          });

        expect(
          result[0]
            .channels[0]
            .status,
        ).toBe(
          "NOT_CONFIGURED",
        );

        expect(
          result[0]
            .channels[0]
            .recommendedChannelPrice,
        ).toBeNull();
      },
    );

    it(
      "applica la commissione Horizon degli immobili PM",
      () => {
        const result =
          buildDailyChannelPrices({
            dailyPrices: [
              {
                date:
                  "2026-08-18",
                recommendedPrice:
                  184,
              },
            ],

            configs: [
              {
                channel:
                  "HORIZON",
                commissionPercent:
                  8,
              },
            ],
          });

        const horizon =
          result[0]
            .channels[0];

        expect(
          horizon.recommendedChannelPrice,
        ).toBe(
          200,
        );

        expect(
          horizon.estimatedCommission,
        ).toBe(
          16,
        );

        expect(
          horizon.estimatedNetRevenue,
        ).toBe(
          184,
        );
      },
    );
  },
);
