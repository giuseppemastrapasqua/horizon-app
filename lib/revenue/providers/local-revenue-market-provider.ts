import type {
  RevenueMarketProvider,
  RevenueMarketQuery,
  RevenueMarketResult,
} from "./revenue-market-provider";

export class LocalRevenueMarketProvider
  implements RevenueMarketProvider
{
  readonly name = "LOCAL";

  async getMarketData(
    query: RevenueMarketQuery,
  ): Promise<RevenueMarketResult> {
    return {
      provider: this.name,
      capturedAt: new Date(),
      currency: "EUR",

      market: {
        name: [
          query.location.zone,
          query.location.city,
        ]
          .filter(Boolean)
          .join(", "),

        adr: 175,
        occupancy: 72,
        revenue: null,
        demandIndex: 0.68,
        bookingPace: null,
        activeSupply: 120,
      },

      comparables: [],

      days: [
        {
          date: query.startDate,
          marketMedianPrice: 175,
          marketLowPrice: 150,
          marketHighPrice: 210,
          marketOccupancy: 72,
          competitorAvailability: 34,
          demandIndex: 0.68,
          confidence: 85,

          factors: {
            source: "local-test",
          },
        },
      ],

      rawData: {
        source: "local-test",
      },
    };
  }
}
