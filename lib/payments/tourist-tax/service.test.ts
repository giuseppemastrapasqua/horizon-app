import { describe, expect, it, vi } from "vitest";
import {
  createTouristTaxPayment,
  reconcileTouristTaxPayment,
} from "./service";
import type { TouristTaxPaymentRepository } from "./repository";
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
    providerPaymentId: null,
    paymentUrl: null,
    expiresAt: null,
    paidAt: null,
    ...overrides,
  };
}

describe("tourist tax payment service", () => {
  it("creates a pending payment and attaches provider data", async () => {
    const repository: TouristTaxPaymentRepository = {
      findPendingByBookingId: vi.fn().mockResolvedValue(null),
      findPaidByBookingId: vi.fn().mockResolvedValue(null),
      createPending: vi.fn().mockResolvedValue(payment()),
      attachProviderPayment: vi.fn().mockResolvedValue(
        payment({
          providerPaymentId: "psp_1",
          paymentUrl: "https://example.test/pay/psp_1",
        }),
      ),
      markPaidByProviderPaymentId: vi.fn(),
    };

    const provider: TouristTaxPaymentProviderAdapter = {
      provider: "STRIPE",
      createPayment: vi.fn().mockResolvedValue({
        provider: "STRIPE",
        providerPaymentId: "psp_1",
        paymentUrl: "https://example.test/pay/psp_1",
      }),
    };

    const result = await createTouristTaxPayment({
      bookingId: "booking_1",
      amount: 76,
      repository,
      provider,
    });

    expect(repository.createPending).toHaveBeenCalledWith({
      bookingId: "booking_1",
      amount: 76,
      currency: "EUR",
      provider: "STRIPE",
    });

    expect(provider.createPayment).toHaveBeenCalledWith({
      paymentId: "pay_1",
      bookingId: "booking_1",
      amount: 76,
      currency: "EUR",
      reference: "pay_1",
    });

    expect(result.providerPaymentId).toBe("psp_1");
  });

  it("normalizes money to two decimals", async () => {
    const repository: TouristTaxPaymentRepository = {
      findPendingByBookingId: vi.fn().mockResolvedValue(null),
      findPaidByBookingId: vi.fn().mockResolvedValue(null),
      createPending: vi.fn().mockResolvedValue(payment({ amount: 19.01 })),
      attachProviderPayment: vi.fn().mockResolvedValue(payment({ amount: 19.01 })),
      markPaidByProviderPaymentId: vi.fn(),
    };

    const provider: TouristTaxPaymentProviderAdapter = {
      provider: "STRIPE",
      createPayment: vi.fn().mockResolvedValue({
        provider: "STRIPE",
        providerPaymentId: "psp_1",
        paymentUrl: "https://example.test/pay/psp_1",
      }),
    };

    await createTouristTaxPayment({
      bookingId: "booking_1",
      amount: 19.005,
      repository,
      provider,
    });

    expect(repository.createPending).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 19.01 }),
    );
  });

  it("rejects zero or negative amounts", async () => {
    const repository = {} as TouristTaxPaymentRepository;
    const provider = {} as TouristTaxPaymentProviderAdapter;

    await expect(
      createTouristTaxPayment({
        bookingId: "booking_1",
        amount: 0,
        repository,
        provider,
      }),
    ).rejects.toThrow("greater than zero");
  });

  it("rejects a provider mismatch", async () => {
    const repository: TouristTaxPaymentRepository = {
      findPendingByBookingId: vi.fn().mockResolvedValue(null),
      findPaidByBookingId: vi.fn().mockResolvedValue(null),
      createPending: vi.fn().mockResolvedValue(payment()),
      attachProviderPayment: vi.fn(),
      markPaidByProviderPaymentId: vi.fn(),
    };

    const provider = {
      provider: "STRIPE",
      createPayment: vi.fn().mockResolvedValue({
        provider: "OTHER",
        providerPaymentId: "psp_1",
        paymentUrl: "https://example.test/pay/psp_1",
      }),
    } as unknown as TouristTaxPaymentProviderAdapter;

    await expect(
      createTouristTaxPayment({
        bookingId: "booking_1",
        amount: 76,
        repository,
        provider,
      }),
    ).rejects.toThrow("Payment provider mismatch");

    expect(repository.attachProviderPayment).not.toHaveBeenCalled();
  });

  it("reconciles a successful provider payment", async () => {
    const repository: TouristTaxPaymentRepository = {
      findPendingByBookingId: vi.fn().mockResolvedValue(null),
      findPaidByBookingId: vi.fn().mockResolvedValue(null),
      createPending: vi.fn(),
      attachProviderPayment: vi.fn(),
      markPaidByProviderPaymentId: vi.fn().mockResolvedValue(
        payment({
          status: "PAID",
          providerPaymentId: "psp_1",
          paidAt: new Date("2026-09-16T10:00:00Z"),
        }),
      ),
    };

    const paidAt = new Date("2026-09-16T10:00:00Z");

    const result = await reconcileTouristTaxPayment({
      provider: "STRIPE",
      providerPaymentId: "psp_1",
      paidAt,
      repository,
    });

    expect(repository.markPaidByProviderPaymentId).toHaveBeenCalledWith(
      "STRIPE",
      "psp_1",
      paidAt,
    );

    expect(result?.status).toBe("PAID");
  });
});


