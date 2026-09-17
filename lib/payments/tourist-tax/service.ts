import type { TouristTaxPaymentRepository } from "./repository";
import type {
  TouristTaxPaymentProviderAdapter,
  TouristTaxPaymentProviderName,
  TouristTaxPaymentRecord,
} from "./types";

function normalizeAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Tourist tax payment amount must be greater than zero.");
  }

  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export async function createTouristTaxPayment(input: {
  bookingId: string;
  amount: number;
  repository: TouristTaxPaymentRepository;
  provider: TouristTaxPaymentProviderAdapter;
}): Promise<TouristTaxPaymentRecord> {
  const amount = normalizeAmount(input.amount);

  const pending = await input.repository.createPending({
    bookingId: input.bookingId,
    amount,
    currency: "EUR",
    provider: input.provider.provider,
  });

  const providerPayment = await input.provider.createPayment({
    paymentId: pending.id,
      bookingId: input.bookingId,
    amount,
    currency: "EUR",
    reference: pending.id,
  });

  if (providerPayment.provider !== input.provider.provider) {
    throw new Error("Payment provider mismatch.");
  }

  return input.repository.attachProviderPayment({
    id: pending.id,
    providerPaymentId: providerPayment.providerPaymentId,
    paymentUrl: providerPayment.paymentUrl,
    expiresAt: providerPayment.expiresAt,
  });
}

export async function reconcileTouristTaxPayment(input: {
  provider: TouristTaxPaymentProviderName;
  providerPaymentId: string;
  paidAt: Date;
  repository: TouristTaxPaymentRepository;
}): Promise<TouristTaxPaymentRecord | null> {
  if (!input.providerPaymentId.trim()) {
    throw new Error("Provider payment id is required.");
  }

  return input.repository.markPaidByProviderPaymentId(
    input.provider,
    input.providerPaymentId,
    input.paidAt,
  );
}

