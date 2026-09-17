export type TouristTaxPaymentStatus =
  | "PENDING"
  | "PAID"
  | "EXPIRED"
  | "CANCELLED"
  | "FAILED";

export type TouristTaxPaymentProviderName = "STRIPE";

export type CreateTouristTaxPaymentRequest = {
  paymentId: string;
  bookingId: string;
  amount: number;
  currency: "EUR";
  reference: string;
};

export type CreatedTouristTaxPayment = {
  provider: TouristTaxPaymentProviderName;
  providerPaymentId: string;
  paymentUrl: string;
  expiresAt?: Date;
};

export interface TouristTaxPaymentProviderAdapter {
  readonly provider: TouristTaxPaymentProviderName;

  createPayment(
    request: CreateTouristTaxPaymentRequest,
  ): Promise<CreatedTouristTaxPayment>;
}

export type TouristTaxPaymentRecord = {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: TouristTaxPaymentStatus;
  provider: TouristTaxPaymentProviderName;
  providerPaymentId: string | null;
  paymentUrl: string | null;
  expiresAt: Date | null;
  paidAt: Date | null;
};
