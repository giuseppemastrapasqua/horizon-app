import type {
  TouristTaxPaymentProviderAdapter,
  TouristTaxPaymentRecord,
} from "./types";
import type { TouristTaxPaymentRepository } from "./repository";
import { createTouristTaxPayment } from "./service";

export type BookingTaxGuest = {
  classification: {
    status: "CLASSIFIED" | "REVIEW_REQUIRED";
    taxAmount: number | null;
  } | null;
};

export type BookingTaxSnapshot = {
  id: string;
  guests: BookingTaxGuest[];
};

export interface BookingTaxSnapshotRepository {
  findById(bookingId: string): Promise<BookingTaxSnapshot | null>;
}

export type BookingTouristTaxPaymentResult =
  | {
      outcome: "NOTHING_TO_PAY";
      amount: 0;
      payment: null;
    }
  | {
      outcome: "ALREADY_PAID";
      amount: number;
      payment: TouristTaxPaymentRecord;
    }
  | {
      outcome: "REUSE_PENDING";
      amount: number;
      payment: TouristTaxPaymentRecord;
    }
  | {
      outcome: "CREATED";
      amount: number;
      payment: TouristTaxPaymentRecord;
    };

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function createBookingTouristTaxPayment(input: {
  bookingId: string;
  bookingRepository: BookingTaxSnapshotRepository;
  paymentRepository: TouristTaxPaymentRepository;
  provider: TouristTaxPaymentProviderAdapter;
}): Promise<BookingTouristTaxPaymentResult> {
  const booking = await input.bookingRepository.findById(
    input.bookingId,
  );

  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (booking.guests.length === 0) {
    throw new Error(
      "Tourist tax payment blocked: booking has no guests.",
    );
  }

  let total = 0;

  for (const guest of booking.guests) {
    const classification = guest.classification;

    if (
      !classification ||
      classification.status !== "CLASSIFIED"
    ) {
      throw new Error(
        "Tourist tax payment blocked: fiscal classification is incomplete.",
      );
    }

    if (classification.taxAmount === null) {
      throw new Error(
        "Tourist tax payment blocked: tax amount is missing.",
      );
    }

    if (
      !Number.isFinite(classification.taxAmount) ||
      classification.taxAmount < 0
    ) {
      throw new Error(
        "Tourist tax payment blocked: invalid tax amount.",
      );
    }

    total += classification.taxAmount;
  }

  const amount = roundMoney(total);

  if (amount === 0) {
    return {
      outcome: "NOTHING_TO_PAY",
      amount: 0,
      payment: null,
    };
  }

  /*
   * PAID has precedence over PENDING:
   * once the booking tax has been collected, Horizon must not
   * automatically generate another payment.
   */
  const paid =
    await input.paymentRepository.findPaidByBookingId(
      booking.id,
    );

  if (paid) {
    return {
      outcome: "ALREADY_PAID",
      amount,
      payment: paid,
    };
  }

  const pending =
    await input.paymentRepository.findPendingByBookingId(
      booking.id,
    );

  if (pending) {
    /*
     * Defensive consistency check. A stale payment created for a
     * different fiscal total must never silently be reused.
     */
    if (roundMoney(pending.amount) !== amount) {
      throw new Error(
        "Tourist tax payment blocked: pending payment amount does not match current fiscal total.",
      );
    }

    /*
     * Recovery path:
     * Horizon persists the PENDING payment before calling the PSP.
     * If the PSP call failed, the record can legitimately exist
     * without a provider payment id / Checkout URL.
     *
     * Reuse the same Horizon payment id when retrying the provider.
     * Stripe therefore receives the same idempotency key and cannot
     * create duplicate Checkout Sessions for this payment.
     */
    if (
      !pending.providerPaymentId ||
      !pending.paymentUrl
    ) {
      const providerPayment =
        await input.provider.createPayment({
          paymentId: pending.id,
          bookingId: booking.id,
          amount,
          currency: "EUR",
          reference: pending.id,
        });

      if (
        providerPayment.provider !==
        input.provider.provider
      ) {
        throw new Error(
          "Tourist tax payment provider mismatch.",
        );
      }

      const recovered =
        await input.paymentRepository.attachProviderPayment({
          id: pending.id,
          providerPaymentId:
            providerPayment.providerPaymentId,
          paymentUrl: providerPayment.paymentUrl,
          expiresAt: providerPayment.expiresAt,
        });

      return {
        outcome: "REUSE_PENDING",
        amount,
        payment: recovered,
      };
    }

    return {
      outcome: "REUSE_PENDING",
      amount,
      payment: pending,
    };
  }

  const payment = await createTouristTaxPayment({
    bookingId: booking.id,
    amount,
    repository: input.paymentRepository,
    provider: input.provider,
  });

  return {
    outcome: "CREATED",
    amount,
    payment,
  };
}
