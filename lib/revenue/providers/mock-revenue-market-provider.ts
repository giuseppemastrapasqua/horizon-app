import type {
  RevenueMarketProvider,
  RevenueMarketQuery,
  RevenueMarketResult,
} from "./revenue-market-provider";

export class MockRevenueMarketProvider
  implements RevenueMarketProvider
{
  readonly name = "MOCK";

  constructor(
    private readonly result:
      Omit<
        RevenueMarketResult,
        "provider"
      >,
  ) {}

  async getMarketData(
    _query: RevenueMarketQuery,
  ): Promise<RevenueMarketResult> {
    return {
      ...this.result,
      provider: this.name,
    };
  }
}
