
export type PricingChannel =
  | "BOOKING"
  | "AIRBNB"
  | "VRBO"
  | "HORIZON";

export type ChannelPricingConfig = {
  channel: PricingChannel;
  commissionPercent: number | null;
};

export type ChannelPricingResult =
  | {
      status: "CONFIGURED";
      channel: PricingChannel;
      baseRevenuePrice: number;
      commissionPercent: number;
      recommendedChannelPrice: number;
      estimatedCommission: number;
      estimatedNetRevenue: number;
    }
  | {
      status: "NOT_CONFIGURED";
      channel: PricingChannel;
      baseRevenuePrice: number;
      commissionPercent: null;
      recommendedChannelPrice: null;
      estimatedCommission: null;
      estimatedNetRevenue: null;
    };

export function buildChannelPrice({
  baseRevenuePrice,
  config,
}: {
  baseRevenuePrice: number;
  config: ChannelPricingConfig;
}): ChannelPricingResult {
  if (
    !Number.isFinite(baseRevenuePrice) ||
    baseRevenuePrice < 0
  ) {
    throw new Error(
      "baseRevenuePrice non valido.",
    );
  }

  const commissionPercent =
    config.commissionPercent;

  if (commissionPercent === null) {
    return {
      status: "NOT_CONFIGURED",
      channel: config.channel,
      baseRevenuePrice,
      commissionPercent: null,
      recommendedChannelPrice: null,
      estimatedCommission: null,
      estimatedNetRevenue: null,
    };
  }

  if (
    !Number.isFinite(commissionPercent) ||
    commissionPercent < 0 ||
    commissionPercent >= 100
  ) {
    throw new Error(
      "commissionPercent non valido.",
    );
  }

  const commissionRate =
    commissionPercent / 100;

  const recommendedChannelPrice =
    roundMoney(
      baseRevenuePrice /
        (1 - commissionRate),
    );

  const estimatedCommission =
    roundMoney(
      recommendedChannelPrice *
        commissionRate,
    );

  const estimatedNetRevenue =
    roundMoney(
      recommendedChannelPrice -
        estimatedCommission,
    );

  return {
    status: "CONFIGURED",
    channel: config.channel,
    baseRevenuePrice,
    commissionPercent,
    recommendedChannelPrice,
    estimatedCommission,
    estimatedNetRevenue,
  };
}

export function buildChannelPrices({
  baseRevenuePrice,
  configs,
}: {
  baseRevenuePrice: number;
  configs: ChannelPricingConfig[];
}) {
  return configs.map(
    (config) =>
      buildChannelPrice({
        baseRevenuePrice,
        config,
      }),
  );
}

function roundMoney(
  value: number,
) {
  return (
    Math.round(value * 100) /
    100
  );
}