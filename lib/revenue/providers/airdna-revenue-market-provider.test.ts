import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AirDnaClient,
} from "./airdna-client";

import {
  AirDnaRevenueMarketProvider,
} from "./airdna-revenue-market-provider";

describe(
  "AirDnaRevenueMarketProvider",
  () => {
    it(
      "normalizza market search e future pricing nel contratto Horizon",
      async () => {
        const requests:
          Array<{
            url: string;
            init?:
              RequestInit;
          }> = [];

        const fetchImpl:
          typeof fetch =
          async (
            input,
            init,
          ) => {
            const url =
              String(
                input,
              );

            requests.push({
              url,
              init,
            });

            if (
              url.endsWith(
                "/market/search",
              )
            ) {
              return new Response(
                JSON.stringify({
                  payload: {
                    results: [
                      {
                        id:
                          "airdna-milano",

                        name:
                          "Milano",

                        type:
                          "market",

                        listing_count:
                          1000,

                        location_name:
                          "Milano, Lombardia, Italia",
                      },
                    ],
                  },
                }),
                {
                  status: 200,
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                },
              );
            }

            return new Response(
              JSON.stringify({
                payload: {
                  metrics: [
                    {
                      date:
                        "2026-09-15",

                      available_count:
                        20,

                      booked_count:
                        80,

                      mean_available_rate:
                        220,

                      mean_booked_rate:
                        210,

                      median_available_rate:
                        215,

                      median_booked_rate:
                        205,

                      occupancy:
                        80,
                    },
                  ],
                },
              }),
              {
                status: 200,
                headers: {
                  "Content-Type":
                    "application/json",
                },
              },
            );
          };

        const client =
          new AirDnaClient({
            apiKey:
              "test-key",

            fetchImpl,
          });

        const provider =
          new AirDnaRevenueMarketProvider(
            client,
          );

        const result =
          await provider.getMarketData({
            propertyId:
              "property-1",

            location: {
              city:
                "Milano",

              zone:
                null,
            },

            property: {
              maxGuests:
                4,

              bedrooms:
                2,

              bathrooms:
                1,
            },

            startDate:
              new Date(
                2026,
                8,
                1,
              ),

            endDate:
              new Date(
                2026,
                8,
                30,
              ),
          });

        expect(
          requests,
        ).toHaveLength(
          2,
        );

        expect(
          requests[0]?.url,
        ).toContain(
          "/market/search",
        );

        expect(
          requests[1]?.url,
        ).toContain(
          "/market/airdna-milano/future_pricing",
        );

        const headers =
          requests[0]
            ?.init
            ?.headers as
            Record<
              string,
              string
            >;

        expect(
          headers.Authorization,
        ).toBe(
          "Bearer test-key",
        );

        expect(
          result.provider,
        ).toBe(
          "AIRDNA",
        );

        expect(
          result.market.name,
        ).toBe(
          "Milano, Lombardia, Italia",
        );

        expect(
          result.market.occupancy,
        ).toBe(
          80,
        );

        expect(
          result.days[0]
            ?.marketMedianPrice,
        ).toBe(
          215,
        );

        expect(
          result.days[0]
            ?.competitorAvailability,
        ).toBe(
          20,
        );

        expect(
          result.days[0]
            ?.demandIndex,
        ).toBe(
          0.8,
        );

        expect(
          result.comparables,
        ).toEqual([]);
      },
    );
  },
);
