import { describe, expect, it, vi } from "vitest";

import { PrismaSoggiorniamoFiscalClassificationRepository } from "./prisma-fiscal-classification-repository";

describe("PrismaSoggiorniamoFiscalClassificationRepository", () => {
  it("legge la classificazione esistente per bookingGuestId", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      bookingGuestId: "guest-1",
      source: "MANUAL",
    });

    const repository =
      new PrismaSoggiorniamoFiscalClassificationRepository({
        soggiorniamoFiscalClassification: {
          findUnique,
          upsert: vi.fn(),
        },
      } as never);

    await expect(
      repository.findByBookingGuestId("guest-1"),
    ).resolves.toEqual({
      bookingGuestId: "guest-1",
      source: "MANUAL",
    });

    expect(findUnique).toHaveBeenCalledWith({
      where: {
        bookingGuestId: "guest-1",
      },
      select: {
        bookingGuestId: true,
        source: true,
      },
    });
  });

  it("esegue upsert della classificazione AUTO", async () => {
    const upsert = vi.fn().mockResolvedValue({
      id: "classification-1",
    });

    const repository =
      new PrismaSoggiorniamoFiscalClassificationRepository({
        soggiorniamoFiscalClassification: {
          findUnique: vi.fn(),
          upsert,
        },
      } as never);

    const create = {
      bookingGuestId: "guest-1",
      guestTypeCode: 2,
      tariff: null,
      taxAmount: null,
      intermediary: null,
      source: "AUTO" as const,
      status: "CLASSIFIED" as const,
      reason: "MINOR_UNDER_18",
    };

    const {
      bookingGuestId: _bookingGuestId,
      ...update
    } = create;

    await repository.upsert({
      where: {
        bookingGuestId: "guest-1",
      },
      create,
      update,
    });

    expect(upsert).toHaveBeenCalledWith({
      where: {
        bookingGuestId: "guest-1",
      },
      create,
      update,
    });
  });
});
