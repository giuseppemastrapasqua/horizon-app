import {
  describe,
  expect,
  it,
} from "vitest";

import {
  getPricingChannelFromConfig,
} from "./get-pricing-channel-from-config";

describe(
  "getPricingChannelFromConfig",
  () => {
    it(
      "riconosce Booking",
      () => {
        expect(
          getPricingChannelFromConfig({
            channel: "BOOKING",
          }),
        ).toBe(
          "BOOKING",
        );
      },
    );

    it(
      "riconosce Airbnb e Vrbo",
      () => {
        expect(
          getPricingChannelFromConfig({
            channel: "AIRBNB",
          }),
        ).toBe(
          "AIRBNB",
        );

        expect(
          getPricingChannelFromConfig({
            channel: "VRBO",
          }),
        ).toBe(
          "VRBO",
        );
      },
    );

    it(
      "mappa DIRECT sul marketplace Horizon",
      () => {
        expect(
          getPricingChannelFromConfig({
            channel: "DIRECT",
          }),
        ).toBe(
          "HORIZON",
        );
      },
    );

    it(
      "ignora configurazioni senza canale valido",
      () => {
        expect(
          getPricingChannelFromConfig({
            channel: "OTHER",
          }),
        ).toBeNull();

        expect(
          getPricingChannelFromConfig(
            null,
          ),
        ).toBeNull();
      },
    );
  },
);
