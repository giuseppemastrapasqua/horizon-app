import { AirDnaRevenueMarketProvider } from "./airdna-revenue-market-provider";
import { createAirDnaClientFromEnv } from "./airdna-client";
import { LocalRevenueMarketProvider } from "./local-revenue-market-provider";

export function createRevenueMarketProvider() {
  const provider =
    process.env.REVENUE_MARKET_PROVIDER?.trim().toUpperCase() ??
    "AIRDNA";

  if (provider === "LOCAL") {
    return new LocalRevenueMarketProvider();
  }

  return new AirDnaRevenueMarketProvider(
    createAirDnaClientFromEnv(),
  );
}
