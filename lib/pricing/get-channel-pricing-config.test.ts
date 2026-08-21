import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getChannelPricingConfig,
} from "./get-channel-pricing-config";

describe(
  "getChannelPricingConfig",
  () => {
    it(
      "legge la commissione dalla configurazione pricing",
      () => {
        expect(
          getChannelPricingConfig({
            feedUrl:
              "https://example.com/calendar.ics",
            channel:
              "BOOKING",
            pricing: {
              commissionPercent:
                18,
            },
          }),
        ).toEqual({
          commissionPercent:
            18,
        });
      },
    );

    it(
      "restituisce null quando pricing non è configurato",
      () => {
        expect(
          getChannelPricingConfig({
            feedUrl:
              "https://example.com/calendar.ics",
            channel:
              "AIRBNB",
          }),
        ).toEqual({
          commissionPercent:
            null,
        });
      },
    );

    it(
      "ignora commissioni non valide",
      () => {
        expect(
          getChannelPricingConfig({
            pricing: {
              commissionPercent:
                120,
            },
          }),
        ).toEqual({
          commissionPercent:
            null,
        });
      },
    );
  },
);
