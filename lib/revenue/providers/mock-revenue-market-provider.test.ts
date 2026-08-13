import {
  describe,
  expect,
  it,
} from "vitest";

import {
  MockRevenueMarketProvider,
} from "./mock-revenue-market-provider";

describe(
  "MockRevenueMarketProvider",
  () => {
    it(
      "restituisce dati di mercato usando il contratto Horizon",
      async () => {
        const capturedAt =
          new Date(
            "2026-09-01T10:00:00.000Z",
          );

        const provider =
          new MockRevenueMarketProvider({
            capturedAt,
            currency: "EUR",

            market: {
              name: "Milano",
              adr: 210,
              occupancy: 78,
              demandIndex: 0.82,
              activeSupply: 1250,
            },

            comparables: [
              {
                externalListingId:
                  "test-1",

                bedrooms: 2,
                maxGuests: 4,
                adr: 205,
                occupancyRate: 76,
                similarityScore: 92,
              },
            ],

            days: [
              {
                date:
                  new Date(
                    "2026-09-15T00:00:00.000Z",
                  ),

                marketMedianPrice:
                  218,

                marketLowPrice:
                  195,

                marketHighPrice:
                  240,

                marketOccupancy:
                  81,

                competitorAvailability:
                  7,

                demandIndex:
                  0.86,

                confidence:
                  90,
              },
            ],
          });

        const result =
          await provider.getMarketData({
            propertyId:
              "property-test",

            location: {
              city: "Milano",
              zone: "Centro",
            },

            property: {
              maxGuests: 4,
              bedrooms: 2,
              bathrooms: 1,
            },

            startDate:
              new Date(
                "2026-09-01T00:00:00.000Z",
              ),

            endDate:
              new Date(
                "2026-09-30T00:00:00.000Z",
              ),
          });

        expect(
          result.provider,
        ).toBe("MOCK");

        expect(
          result.comparables,
        ).toHaveLength(1);

        expect(
          result.days[0]
            .marketMedianPrice,
        ).toBe(218);

        expect(
          result.market.occupancy,
        ).toBe(78);
      },
    );
  },
);
