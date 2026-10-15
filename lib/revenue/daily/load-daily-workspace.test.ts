import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ roles: vi.fn(), scope: vi.fn(), properties: vi.fn(), stays: vi.fn(), blocks: vi.fn(), market: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireRoles: m.roles, getAccessiblePropertyIds: m.scope }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404"); } }));
vi.mock("@/lib/prisma", () => ({ prisma: { property: { findMany: m.properties }, booking: { findMany: m.stays }, propertyAvailabilityBlock: { findMany: m.blocks }, revenueDailySignal: { findMany: m.market } } }));
import { loadDailyWorkspace } from "./load-daily-workspace";
const from = new Date("2026-10-15T00:00:00Z");
describe("daily revenue data access", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.scope.mockResolvedValue(["own"]);
    m.properties.mockResolvedValue([{ id: "own", name: "Own", ratePlans: [] }]);
    m.stays.mockResolvedValue([]); m.blocks.mockResolvedValue([]); m.market.mockResolvedValue([]);
  });
  it("requires manager access and scopes all datasets", async () => {
    await loadDailyWorkspace("own", from, from);
    expect(m.roles).toHaveBeenCalledWith(["SUPER_ADMIN", "MANAGER"]);
    expect(m.properties.mock.calls[0][0].where).toEqual({ id: { in: ["own"] } });
    for (const query of [m.stays, m.blocks, m.market]) expect(query.mock.calls[0][0].where.propertyId).toBe("own");
    expect(m.stays.mock.calls[0][0].select).toEqual({ checkIn: true, checkOut: true, bookedAt: true });
  });
  it("rejects a foreign property without querying its bookings", async () => {
    await expect(loadDailyWorkspace("foreign", from, from)).rejects.toThrow("404");
    expect(m.stays).not.toHaveBeenCalled();
  });
  it("rejects unauthorized users before database access", async () => {
    m.roles.mockRejectedValue(new Error("denied"));
    await expect(loadDailyWorkspace("own", from, from)).rejects.toThrow("denied");
    expect(m.properties).not.toHaveBeenCalled();
  });
});
