import {
  buildChannelPrices,
  type ChannelPricingConfig,
  type ChannelPricingResult,
} from "./channel-pricing";

export type RevenueDailyPriceInput = {
  date: string;
  recommendedPrice: number;
};

export type DailyChannelPricingResult = {
  date: string;
  baseRevenuePrice: number;
  channels: ChannelPricingResult[];
};

export type BuildDailyChannelPricesInput = {
  dailyPrices: RevenueDailyPriceInput[];
  configs: ChannelPricingConfig[];
};

export function buildDailyChannelPrices({
  dailyPrices,
  configs,
}: BuildDailyChannelPricesInput): DailyChannelPricingResult[] {
  return dailyPrices.map(
    (dailyPrice) => ({
      date:
        dailyPrice.date,

      baseRevenuePrice:
        dailyPrice.recommendedPrice,

      channels:
        buildChannelPrices({
          baseRevenuePrice:
            dailyPrice.recommendedPrice,
          configs,
        }),
    }),
  );
}
