import type {
  TouristTaxPaymentProviderName,
  TouristTaxPaymentRecord,
} from "./types";

export type CreatePendingTouristTaxPaymentInput = {
  bookingId: string;
  amount: number;
  currency: string;
  provider: TouristTaxPaymentProviderName;
};

export type AttachProviderPaymentInput = {
  id: string;
  providerPaymentId: string;
  paymentUrl: string;
  expiresAt?: Date;
};

export interface TouristTaxPaymentRepository {
  findPendingByBookingId(
    bookingId: string,
  ): Promise<TouristTaxPaymentRecord | null>;

  findPaidByBookingId(
    bookingId: string,
  ): Promise<TouristTaxPaymentRecord | null>;

  createPending(
    input: CreatePendingTouristTaxPaymentInput,
  ): Promise<TouristTaxPaymentRecord>;

  attachProviderPayment(
    input: AttachProviderPaymentInput,
  ): Promise<TouristTaxPaymentRecord>;

  markPaidByProviderPaymentId(
    provider: TouristTaxPaymentProviderName,
    providerPaymentId: string,
    paidAt: Date,
  ): Promise<TouristTaxPaymentRecord | null>;
}
