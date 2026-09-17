import {
  Prisma,
  TouristTaxPaymentProvider,
  TouristTaxPaymentStatus,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { PrismaTouristTaxPaymentRepository } from "./prisma-tourist-tax-payment-repository";

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "pay_1",
    bookingId: "booking_1",
    amount: new Prisma.Decimal("76.00"),
    currency: "EUR",
    status: TouristTaxPaymentStatus.PENDING,
    provider: TouristTaxPaymentProvider.STRIPE,
    providerPaymentId: null,
    paymentUrl: null,
    expiresAt: null,
    paidAt: null,
    failedAt: null,
    cancelledAt: null,
    createdAt: new Date("2026-09-16T10:00:00Z"),
    updatedAt: new Date("2026-09-16T10:00:00Z"),
    ...overrides,
  };
}

function client() {
  return {
    touristTaxPayment: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe("PrismaTouristTaxPaymentRepository", () => {
  it("reuses an existing PENDING payment", async () => {
    const db = client();

    db.touristTaxPayment.findFirst.mockResolvedValueOnce(row());

    const repository =
      new PrismaTouristTaxPaymentRepository(db as never);

    const result = await repository.createPending({
      bookingId: "booking_1",
      amount: 76,
      currency: "EUR",
      provider: "STRIPE",
    });

    expect(result.id).toBe("pay_1");
    expect(db.touristTaxPayment.create).not.toHaveBeenCalled();
  });

  it("creates PENDING when none exists", async () => {
    const db = client();

    db.touristTaxPayment.findFirst.mockResolvedValueOnce(null);
    db.touristTaxPayment.create.mockResolvedValueOnce(row());

    const repository =
      new PrismaTouristTaxPaymentRepository(db as never);

    const result = await repository.createPending({
      bookingId: "booking_1",
      amount: 76,
      currency: "EUR",
      provider: "STRIPE",
    });

    expect(db.touristTaxPayment.create).toHaveBeenCalledWith({
      data: {
        bookingId: "booking_1",
        amount: new Prisma.Decimal("76.00"),
        currency: "EUR",
        provider: TouristTaxPaymentProvider.STRIPE,
        status: TouristTaxPaymentStatus.PENDING,
      },
    });

    expect(result.amount).toBe(76);
  });

  it("recovers from a concurrent unique constraint collision", async () => {
    const db = client();

    db.touristTaxPayment.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(row());

    db.touristTaxPayment.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed",
        {
          code: "P2002",
          clientVersion: "6.19.0",
          meta: {
            target: "TouristTaxPayment_one_pending_per_booking",
          },
        },
      ),
    );

    const repository =
      new PrismaTouristTaxPaymentRepository(db as never);

    const result = await repository.createPending({
      bookingId: "booking_1",
      amount: 76,
      currency: "EUR",
      provider: "STRIPE",
    });

    expect(result.id).toBe("pay_1");
    expect(db.touristTaxPayment.findFirst).toHaveBeenCalledTimes(2);
  });

  it("marks a provider payment as PAID", async () => {
    const db = client();
    const paidAt = new Date("2026-09-16T12:00:00Z");

    db.touristTaxPayment.findFirst.mockResolvedValueOnce(
      row({
        providerPaymentId: "psp_1",
      }),
    );

    db.touristTaxPayment.update.mockResolvedValueOnce(
      row({
        providerPaymentId: "psp_1",
        status: TouristTaxPaymentStatus.PAID,
        paidAt,
      }),
    );

    const repository =
      new PrismaTouristTaxPaymentRepository(db as never);

    const result =
      await repository.markPaidByProviderPaymentId(
        "STRIPE",
        "psp_1",
        paidAt,
      );

    expect(db.touristTaxPayment.update).toHaveBeenCalledWith({
      where: {
        id: "pay_1",
      },
      data: {
        status: TouristTaxPaymentStatus.PAID,
        paidAt,
        failedAt: null,
        cancelledAt: null,
      },
    });

    expect(result?.status).toBe("PAID");
  });

  it("treats duplicate PAID notification as idempotent", async () => {
    const db = client();
    const originalPaidAt =
      new Date("2026-09-16T12:00:00Z");

    db.touristTaxPayment.findFirst.mockResolvedValueOnce(
      row({
        providerPaymentId: "psp_1",
        status: TouristTaxPaymentStatus.PAID,
        paidAt: originalPaidAt,
      }),
    );

    const repository =
      new PrismaTouristTaxPaymentRepository(db as never);

    const result =
      await repository.markPaidByProviderPaymentId(
        "STRIPE",
        "psp_1",
        new Date("2026-09-16T13:00:00Z"),
      );

    expect(db.touristTaxPayment.update).not.toHaveBeenCalled();
    expect(result?.paidAt).toEqual(originalPaidAt);
  });

  it("returns null for an unknown provider payment", async () => {
    const db = client();

    db.touristTaxPayment.findFirst.mockResolvedValueOnce(null);

    const repository =
      new PrismaTouristTaxPaymentRepository(db as never);

    const result =
      await repository.markPaidByProviderPaymentId(
        "STRIPE",
        "missing",
        new Date(),
      );

    expect(result).toBeNull();
    expect(db.touristTaxPayment.update).not.toHaveBeenCalled();
  });

  it("finds an existing PAID payment", async () => {
    const db = client();

    db.touristTaxPayment.findFirst.mockResolvedValueOnce(
      row({
        status: TouristTaxPaymentStatus.PAID,
        paidAt: new Date("2026-09-16T12:00:00Z"),
      }),
    );

    const repository =
      new PrismaTouristTaxPaymentRepository(db as never);

    const result =
      await repository.findPaidByBookingId("booking_1");

    expect(db.touristTaxPayment.findFirst).toHaveBeenCalledWith({
      where: {
        bookingId: "booking_1",
        status: TouristTaxPaymentStatus.PAID,
      },
      orderBy: {
        paidAt: "desc",
      },
    });

    expect(result?.status).toBe("PAID");
  });
});

