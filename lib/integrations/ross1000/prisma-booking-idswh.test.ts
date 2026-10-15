import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      findUnique: mocks.findUnique,
      updateMany: mocks.updateMany,
    },
  },
}));

import { buildRoss1000BookingIdswh } from "./booking-idswh";
import { ensureRoss1000BookingIdswh } from "./prisma-booking-idswh";

describe("ensureRoss1000BookingIdswh", () => {
  beforeEach(() => {
    mocks.findUnique.mockReset();
    mocks.updateMany.mockReset();
  });

  it("returns an existing persisted idswh without updating", async () => {
    mocks.findUnique.mockResolvedValueOnce({
      id: "booking-1",
      ross1000Idswh: "Rexisting12345678901",
    });

    await expect(
      ensureRoss1000BookingIdswh("booking-1"),
    ).resolves.toBe("Rexisting12345678901");

    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("assigns and returns a deterministic idswh", async () => {
    const candidate =
      buildRoss1000BookingIdswh("booking-1");

    mocks.findUnique
      .mockResolvedValueOnce({
        id: "booking-1",
        ross1000Idswh: null,
      })
      .mockResolvedValueOnce({
        ross1000Idswh: candidate,
      });

    mocks.updateMany.mockResolvedValue({
      count: 1,
    });

    await expect(
      ensureRoss1000BookingIdswh("booking-1"),
    ).resolves.toBe(candidate);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "booking-1",
        ross1000Idswh: null,
      },
      data: {
        ross1000Idswh: candidate,
      },
    });
  });

  it("returns the persisted winner after a concurrent assignment", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({
        id: "booking-1",
        ross1000Idswh: null,
      })
      .mockResolvedValueOnce({
        ross1000Idswh: "Rconcurrent123456789",
      });

    mocks.updateMany.mockResolvedValue({
      count: 0,
    });

    await expect(
      ensureRoss1000BookingIdswh("booking-1"),
    ).resolves.toBe("Rconcurrent123456789");
  });

  it("rejects a missing booking", async () => {
    mocks.findUnique.mockResolvedValueOnce(null);

    await expect(
      ensureRoss1000BookingIdswh("missing"),
    ).rejects.toThrow(
      "ROSS1000: prenotazione non trovata: missing.",
    );

    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
