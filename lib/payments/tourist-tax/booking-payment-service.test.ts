import { describe, expect, it, vi } from "vitest";

import { createBookingTouristTaxPayment } from "./booking-payment-service";

import type {
  BookingTaxSnapshotRepository,
} from "./booking-payment-service";

import type {
  TouristTaxPaymentRepository,
} from "./repository";

import type {
  TouristTaxPaymentProviderAdapter,
  TouristTaxPaymentRecord,
} from "./types";

function payment(
  overrides: Partial<TouristTaxPaymentRecord> = {},
): TouristTaxPaymentRecord {
  return {
    id: "pay_1",
    bookingId: "booking_1",
    amount: 76,
    currency: "EUR",
    status: "PENDING",
    provider: "STRIPE",
    providerPaymentId: "psp_1",
    paymentUrl: "https://example.test/pay/psp_1",
    expiresAt: null,
    paidAt: null,
    ...overrides,
  };
}

function bookingRepository(
  guests: Array<{
    classification: {
      status: "CLASSIFIED" | "REVIEW_REQUIRED";
      taxAmount: number | null;
    } | null;
  }>,
): BookingTaxSnapshotRepository {
  return {
    findById: vi.fn().mockResolvedValue({
      id: "booking_1",
      guests,
    }),
  };
}

function paymentRepository(
  overrides: Partial<TouristTaxPaymentRepository> = {},
): TouristTaxPaymentRepository {
  return {
    findPendingByBookingId: vi.fn().mockResolvedValue(null),
    findPaidByBookingId: vi.fn().mockResolvedValue(null),
    createPending: vi.fn().mockResolvedValue(
      payment({
        providerPaymentId: null,
        paymentUrl: null,
      }),
    ),
    attachProviderPayment: vi.fn().mockResolvedValue(payment()),
    markPaidByProviderPaymentId: vi.fn(),
    ...overrides,
  };
}

function provider(): TouristTaxPaymentProviderAdapter {
  return {
    provider: "STRIPE",
    createPayment: vi.fn().mockResolvedValue({
      provider: "STRIPE",
      providerPaymentId: "psp_1",
      paymentUrl: "https://example.test/pay/psp_1",
    }),
  };
}

describe("createBookingTouristTaxPayment", () => {
  it("creates Ã¢â€šÂ¬76 from four canonical Ã¢â€šÂ¬19 classifications", async () => {
    const payments = paymentRepository();

    const result = await createBookingTouristTaxPayment({
      bookingId: "booking_1",
      bookingRepository: bookingRepository([
        { classification: { status: "CLASSIFIED", taxAmount: 19 } },
        { classification: { status: "CLASSIFIED", taxAmount: 19 } },
        { classification: { status: "CLASSIFIED", taxAmount: 19 } },
        { classification: { status: "CLASSIFIED", taxAmount: 19 } },
      ]),
      paymentRepository: payments,
      provider: provider(),
    });

    expect(result.outcome).toBe("CREATED");
    expect(result.amount).toBe(76);

    expect(payments.createPending).toHaveBeenCalledWith({
      bookingId: "booking_1",
      amount: 76,
      currency: "EUR",
      provider: "STRIPE",
    });
  });

  it("blocks REVIEW_REQUIRED", async () => {
    await expect(
      createBookingTouristTaxPayment({
        bookingId: "booking_1",
        bookingRepository: bookingRepository([
          {
            classification: {
              status: "REVIEW_REQUIRED",
              taxAmount: null,
            },
          },
        ]),
        paymentRepository: paymentRepository(),
        provider: provider(),
      }),
    ).rejects.toThrow("fiscal classification is incomplete");
  });

  it("blocks missing classification", async () => {
    await expect(
      createBookingTouristTaxPayment({
        bookingId: "booking_1",
        bookingRepository: bookingRepository([
          { classification: null },
        ]),
        paymentRepository: paymentRepository(),
        provider: provider(),
      }),
    ).rejects.toThrow("fiscal classification is incomplete");
  });

  it("blocks missing taxAmount", async () => {
    await expect(
      createBookingTouristTaxPayment({
        bookingId: "booking_1",
        bookingRepository: bookingRepository([
          {
            classification: {
              status: "CLASSIFIED",
              taxAmount: null,
            },
          },
        ]),
        paymentRepository: paymentRepository(),
        provider: provider(),
      }),
    ).rejects.toThrow("tax amount is missing");
  });

  it("returns NOTHING_TO_PAY for a fully classified zero total", async () => {
    const result = await createBookingTouristTaxPayment({
      bookingId: "booking_1",
      bookingRepository: bookingRepository([
        {
          classification: {
            status: "CLASSIFIED",
            taxAmount: 0,
          },
        },
        {
          classification: {
            status: "CLASSIFIED",
            taxAmount: 0,
          },
        },
      ]),
      paymentRepository: paymentRepository(),
      provider: provider(),
    });

    expect(result).toEqual({
      outcome: "NOTHING_TO_PAY",
      amount: 0,
      payment: null,
    });
  });

  it("returns ALREADY_PAID and never creates another payment", async () => {
    const paid = payment({
      status: "PAID",
      paidAt: new Date("2026-09-16T12:00:00Z"),
    });

    const payments = paymentRepository({
      findPaidByBookingId: vi.fn().mockResolvedValue(paid),
    });

    const psp = provider();

    const result = await createBookingTouristTaxPayment({
      bookingId: "booking_1",
      bookingRepository: bookingRepository([
        {
          classification: {
            status: "CLASSIFIED",
            taxAmount: 76,
          },
        },
      ]),
      paymentRepository: payments,
      provider: psp,
    });

    expect(result.outcome).toBe("ALREADY_PAID");
    expect(payments.createPending).not.toHaveBeenCalled();
    expect(psp.createPayment).not.toHaveBeenCalled();
  });

  it("reuses a matching PENDING payment", async () => {
    const pending = payment();

    const payments = paymentRepository({
      findPendingByBookingId: vi.fn().mockResolvedValue(pending),
    });

    const psp = provider();

    const result = await createBookingTouristTaxPayment({
      bookingId: "booking_1",
      bookingRepository: bookingRepository([
        {
          classification: {
            status: "CLASSIFIED",
            taxAmount: 76,
          },
        },
      ]),
      paymentRepository: payments,
      provider: psp,
    });

    expect(result.outcome).toBe("REUSE_PENDING");

    if (result.outcome !== "REUSE_PENDING") {
      throw new Error(
        `Expected REUSE_PENDING, received ${result.outcome}`,
      );
    }

    expect(result.payment.id).toBe("pay_1");
    expect(payments.createPending).not.toHaveBeenCalled();
    expect(psp.createPayment).not.toHaveBeenCalled();
  });

  it("blocks reuse when PENDING amount differs from current tax total", async () => {
    const payments = paymentRepository({
      findPendingByBookingId: vi.fn().mockResolvedValue(
        payment({ amount: 57 }),
      ),
    });

    await expect(
      createBookingTouristTaxPayment({
        bookingId: "booking_1",
        bookingRepository: bookingRepository([
          {
            classification: {
              status: "CLASSIFIED",
              taxAmount: 76,
            },
          },
        ]),
        paymentRepository: payments,
        provider: provider(),
      }),
    ).rejects.toThrow(
      "pending payment amount does not match current fiscal total",
    );
  });

  it("recovers a matching incomplete pending payment through the provider", async () => {
    const pending = {
      id: "pay_recovery",
      bookingId: "booking_1",
      amount: 76,
      currency: "EUR",
      status: "PENDING",
      provider: "STRIPE",
      providerPaymentId: null,
      paymentUrl: null,
      expiresAt: null,
      paidAt: null,
      failedAt: null,
      cancelledAt: null,
    } as const;

    const recovered = {
      ...pending,
      providerPaymentId: "cs_test_recovered",
      paymentUrl: "https://checkout.stripe.test/recovered",
      expiresAt: new Date("2026-09-17T12:00:00.000Z"),
    };

    const bookingRepository = {
      findById: vi.fn().mockResolvedValue({
        id: "booking_1",
        guests: [
          {
            classification: {
              status: "CLASSIFIED",
              taxAmount: 19,
            },
          },
          {
            classification: {
              status: "CLASSIFIED",
              taxAmount: 19,
            },
          },
          {
            classification: {
              status: "CLASSIFIED",
              taxAmount: 19,
            },
          },
          {
            classification: {
              status: "CLASSIFIED",
              taxAmount: 19,
            },
          },
        ],
      }),
    };

    const paymentRepository = {
      findPaidByBookingId: vi.fn().mockResolvedValue(null),
      findPendingByBookingId: vi.fn().mockResolvedValue(pending),
      createPending: vi.fn(),
      attachProviderPayment: vi.fn().mockResolvedValue(recovered),
      markPaidByProviderPaymentId: vi.fn(),
    };

    const provider = {
      provider: "STRIPE" as const,
      createPayment: vi.fn().mockResolvedValue({
        provider: "STRIPE" as const,
        providerPaymentId: "cs_test_recovered",
        paymentUrl: "https://checkout.stripe.test/recovered",
        expiresAt: recovered.expiresAt,
      }),
    };

    const result = await createBookingTouristTaxPayment({
      bookingId: "booking_1",
      bookingRepository,
      paymentRepository,
      provider,
    });

    expect(result.outcome).toBe("REUSE_PENDING");

    if (result.outcome !== "REUSE_PENDING") {
      throw new Error(
        `Expected REUSE_PENDING, received ${result.outcome}.`,
      );
    }

    expect(result.amount).toBe(76);
    expect(result.payment.paymentUrl).toBe(
      "https://checkout.stripe.test/recovered",
    );

    expect(provider.createPayment).toHaveBeenCalledWith({
      paymentId: "pay_recovery",
      bookingId: "booking_1",
      amount: 76,
      currency: "EUR",
      reference: "pay_recovery",
    });

    expect(
      paymentRepository.attachProviderPayment,
    ).toHaveBeenCalledWith({
      id: "pay_recovery",
      providerPaymentId: "cs_test_recovered",
      paymentUrl: "https://checkout.stripe.test/recovered",
      expiresAt: recovered.expiresAt,
    });

    expect(
      paymentRepository.createPending,
    ).not.toHaveBeenCalled();
  });
});

