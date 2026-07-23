export type MoneyAmount = {
  amount: number;
  currency: string;
};

export type BookingFinancialSnapshot = {
  bookingId: string;
  grossRevenue: MoneyAmount;
  otaCommission: MoneyAmount;
  cleaningCost: MoneyAmount;
  laundryCost: MoneyAmount;
  utilitiesCost: MoneyAmount;
  ownerPayout: MoneyAmount;
  additionalCosts: MoneyAmount;
  netRevenue: MoneyAmount;
  marginPercentage: number;
};