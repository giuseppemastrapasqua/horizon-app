import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    bookingGuest: {
      findUnique: mocks.findUnique,
      updateMany: mocks.updateMany,
    },
  },
}));

import { buildRoss1000GuestIdswh } from "./guest-idswh";
import { ensureRoss1000GuestIdswh } from "./prisma-guest-idswh";

describe("ensureRoss1000GuestIdswh", () => {
  beforeEach(() => {
    mocks.findUnique.mockReset();
    mocks.updateMany.mockReset();
  });

  it("returns the persisted idswh without rewriting it", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "guest-1",
      ross1000Idswh: "Hexisting12345678901",
    });

    await expect(
      ensureRoss1000GuestIdswh("guest-1"),
    ).resolves.toBe("Hexisting12345678901");

    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("assigns and returns a deterministic idswh", async () => {
    const candidate = buildRoss1000GuestIdswh("guest-1");

    mocks.findUnique
      .mockResolvedValueOnce({
        id: "guest-1",
        ross1000Idswh: null,
      })
      .mockResolvedValueOnce({
        ross1000Idswh: candidate,
      });
    mocks.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      ensureRoss1000GuestIdswh("guest-1"),
    ).resolves.toBe(candidate);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "guest-1",
        ross1000Idswh: null,
      },
      data: {
        ross1000Idswh: candidate,
      },
    });
  });

  it("returns the value written concurrently by another process", async () => {
    mocks.findUnique
      .mockResolvedValueOnce({
        id: "guest-1",
        ross1000Idswh: null,
      })
      .mockResolvedValueOnce({
        ross1000Idswh: "Hconcurrent123456789",
      });
    mocks.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      ensureRoss1000GuestIdswh("guest-1"),
    ).resolves.toBe("Hconcurrent123456789");
  });

  it("rejects an unknown booking guest", async () => {
    mocks.findUnique.mockResolvedValue(null);

    await expect(
      ensureRoss1000GuestIdswh("missing"),
    ).rejects.toThrow("ROSS1000: ospite non trovato: missing.");

    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
