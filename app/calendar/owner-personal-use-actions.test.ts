import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  access: vi.fn(),
  booking: vi.fn(),
  block: vi.fn(),
  periods: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/auth/guards", () => ({
  requireRoles: mocks.role,
  requirePropertyAccess: mocks.access,
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    propertyAvailabilityBlock: { deleteMany: mocks.remove },
  },
}));
import {
  reserveOwnerPersonalUse,
  releaseOwnerPersonalUse,
} from "./owner-personal-use-actions";

function form() {
  const data = new FormData();
  data.set("propertyId", "property-1");
  data.set("startDate", "2026-11-01");
  data.set("endDate", "2026-11-05");
  data.set("blockId", "block-1");
  return data;
}
describe("personal use server boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-11T12:00:00Z"));
    mocks.role.mockResolvedValue({ id: "owner-1", role: "OWNER" });
    mocks.access.mockResolvedValue({ id: "owner-1" });
    mocks.booking.mockResolvedValue(null);
    mocks.block.mockResolvedValue(null);
    mocks.periods.mockResolvedValue([]);
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        booking: { findFirst: mocks.booking },
        propertyAvailabilityBlock: {
          findFirst: mocks.block,
          findMany: mocks.periods,
          create: mocks.create,
        },
      }),
    );
  });
  afterEach(() => vi.useRealTimers());
  it("rejects overlapping stays before creating an availability block", async () => {
    mocks.booking.mockResolvedValue({ id: "booking-1" });
    await expect(reserveOwnerPersonalUse(form())).rejects.toThrow(
      "già occupati",
    );
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.transaction.mock.calls[0][1]).toEqual({
      isolationLevel: "Serializable",
    });
    expect(mocks.booking.mock.calls[0][0].where).toMatchObject({
      checkIn: { lt: new Date("2026-11-06T00:00:00Z") },
      checkOut: { gt: new Date("2026-11-01T00:00:00Z") },
    });
  });
  it("enforces the accumulated annual quota inside the transaction", async () => {
    mocks.periods.mockResolvedValue([
      {
        startDate: new Date("2026-01-01T00:00:00Z"),
        endDate: new Date("2026-01-26T00:00:00Z"),
      },
    ]);
    await expect(reserveOwnerPersonalUse(form())).rejects.toThrow("30 giorni");
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("cannot delete imported or another owner's blocks", async () => {
    mocks.remove.mockResolvedValue({ count: 0 });
    await expect(releaseOwnerPersonalUse(form())).rejects.toThrow(
      "non è modificabile",
    );
    expect(mocks.remove.mock.calls[0][0].where).toMatchObject({
      propertyId: "property-1",
      createdById: "owner-1",
      source: "MANUAL",
      note: "OWNER_PERSONAL_USE_V1",
    });
  });
  it("checks property access before opening a transaction", async () => {
    mocks.access.mockRejectedValue(new Error("forbidden"));
    await expect(reserveOwnerPersonalUse(form())).rejects.toThrow("forbidden");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
