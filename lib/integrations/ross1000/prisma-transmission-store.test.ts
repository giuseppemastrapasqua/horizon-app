import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  findUnique: vi.fn(),
  updateMany: vi.fn(),
  findFirst: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    ross1000Transmission: {
      upsert: mocks.upsert,
      findUnique: mocks.findUnique,
      updateMany: mocks.updateMany,
      findFirst: mocks.findFirst,
    },
  },
}));

import {
  PrismaRoss1000TransmissionStore,
} from "./prisma-transmission-store";

describe("PrismaRoss1000TransmissionStore", () => {
  beforeEach(() => {
    mocks.upsert.mockReset();
    mocks.findUnique.mockReset();
    mocks.updateMany.mockReset();
    mocks.findFirst.mockReset();
    mocks.transaction.mockReset();
    mocks.findUnique.mockResolvedValue({ propertyId: "property-1", movementDate: new Date("2026-09-29T00:00:00Z"), status: "PREPARED" });
    mocks.findFirst.mockResolvedValue(null);
    mocks.transaction.mockImplementation(async (callback) => callback({ ross1000Transmission: { findUnique: mocks.findUnique, findFirst: mocks.findFirst, updateMany: mocks.updateMany } }));
  });

  it("prepares a transmission idempotently", async () => {
    const movementDate =
      new Date("2026-09-29T00:00:00.000Z");

    const transmission = {
      id: "transmission-1",
      propertyId: "property-1",
      movementDate,
      status: "PREPARED",
      payloadHash: "hash-1",
    };

    mocks.upsert.mockResolvedValue(transmission);

    const store =
      new PrismaRoss1000TransmissionStore();

    await expect(
      store.prepare({
        propertyId: "property-1",
        movementDate,
        payloadHash: "hash-1",
        payloadXml: "<movimenti>test</movimenti>",
      }),
    ).resolves.toBe(transmission);

    expect(mocks.upsert).toHaveBeenCalledWith({
      where: {
        propertyId_movementDate_payloadHash: {
          propertyId: "property-1",
          movementDate,
          payloadHash: "hash-1",
        },
      },
      create: {
        propertyId: "property-1",
        movementDate,
        payloadHash: "hash-1",
        payloadXml: "<movimenti>test</movimenti>",
      },
      update: {},
    });
  });

  it("loads the immutable prepared payload by id", async () => {
    const transmission = {
      id: "transmission-1",
      propertyId: "property-1",
      movementDate:
        new Date("2026-09-29T00:00:00.000Z"),
      status: "PREPARED",
      payloadHash: "hash-1",
      payloadXml: "<movimenti>test</movimenti>",
    };

    mocks.findUnique.mockResolvedValue(
      transmission,
    );

    const store =
      new PrismaRoss1000TransmissionStore();

    await expect(
      store.getById("transmission-1"),
    ).resolves.toBe(transmission);

    expect(
      mocks.findUnique,
    ).toHaveBeenCalledWith({
      where: {
        id: "transmission-1",
      },
      select: {
        id: true,
        propertyId: true,
        movementDate: true,
        status: true,
        payloadHash: true,
        payloadXml: true,
      },
    });
  });
  it("moves PREPARED to SENDING atomically", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const store =
      new PrismaRoss1000TransmissionStore();

    await expect(
      store.beginSending("transmission-1"),
    ).resolves.toBe(true);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "transmission-1",
        status: "PREPARED",
      },
      data: {
        status: "SENDING",
        sendStartedAt: expect.any(Date),
        lastError: null,
      },
    });
  });

  it("refuses beginSending when PREPARED was not acquired", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const store =
      new PrismaRoss1000TransmissionStore();

    await expect(
      store.beginSending("transmission-1"),
    ).resolves.toBe(false);
  });

  it("confirms only a SENDING transmission", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const store =
      new PrismaRoss1000TransmissionStore();

    await expect(
      store.markConfirmed("transmission-1"),
    ).resolves.toBe(true);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "transmission-1",
        status: "SENDING",
      },
      data: {
        status: "CONFIRMED",
        responseSuccess: true,
        responseError: null,
        confirmedAt: expect.any(Date),
        lastError: null,
      },
    });
  });

  it("rejects only a SENDING transmission", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const store =
      new PrismaRoss1000TransmissionStore();

    await expect(
      store.markRejected(
        "transmission-1",
        "ROSS1000 rejected payload",
      ),
    ).resolves.toBe(true);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "transmission-1",
        status: "SENDING",
      },
      data: {
        status: "REJECTED",
        responseSuccess: false,
        responseError: "ROSS1000 rejected payload",
        rejectedAt: expect.any(Date),
        lastError: "ROSS1000 rejected payload",
      },
    });
  });

  it("marks an uncertain SENDING outcome without claiming rejection", async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });

    const store =
      new PrismaRoss1000TransmissionStore();

    await expect(
      store.markOutcomeUnknown(
        "transmission-1",
        "Timeout after request dispatch",
      ),
    ).resolves.toBe(true);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "transmission-1",
        status: "SENDING",
      },
      data: {
        status: "OUTCOME_UNKNOWN",
        outcomeUnknownAt: expect.any(Date),
        lastError: "Timeout after request dispatch",
      },
    });
  });

  it("does not apply a terminal transition outside SENDING", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    const store =
      new PrismaRoss1000TransmissionStore();

    await expect(
      store.markConfirmed("transmission-1"),
    ).resolves.toBe(false);

    await expect(
      store.markRejected("transmission-1", "error"),
    ).resolves.toBe(false);

    await expect(
      store.markOutcomeUnknown(
        "transmission-1",
        "unknown",
      ),
    ).resolves.toBe(false);
  });
});

it("does not send a different payload while another result is unresolved", async () => {
  mocks.transaction.mockImplementation(async (callback) => callback({ ross1000Transmission: { findUnique: mocks.findUnique, findFirst: mocks.findFirst, updateMany: mocks.updateMany } }));
  mocks.findUnique.mockResolvedValue({ propertyId: "property-1", movementDate: new Date("2026-09-29T00:00:00Z"), status: "PREPARED" });
  mocks.findFirst.mockResolvedValue({ id: "unknown-transmission" });
  mocks.updateMany.mockClear();
  const store = new PrismaRoss1000TransmissionStore();
  await expect(store.beginSending("transmission-2")).resolves.toBe(false);
  expect(mocks.updateMany).not.toHaveBeenCalled();
  expect(mocks.transaction).toHaveBeenLastCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});
