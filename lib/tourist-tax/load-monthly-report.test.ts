import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ roles: vi.fn(), scope: vi.fn(), properties: vi.fn(), bookings: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireRoles: m.roles, getAccessiblePropertyIds: m.scope }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404"); } }));
vi.mock("@/lib/prisma", () => ({ prisma: { property: { findMany: m.properties }, booking: { findMany: m.bookings } } }));
import { loadMonthlyTaxReport } from "./load-monthly-report";
describe("tourist tax report access", () => {
  beforeEach(() => { vi.resetAllMocks(); m.roles.mockResolvedValue({ id: "m", role: "MANAGER" }); m.scope.mockResolvedValue(["own"]); m.properties.mockResolvedValue([{ id: "own", name: "Own", city: "Milano" }]); m.bookings.mockResolvedValue([]); });
  it("requires financial property access and retrieves only overlapping authorized stays", async () => {
    await loadMonthlyTaxReport(2026);
    expect(m.properties.mock.calls[0][0].where).toEqual({ id: { in: ["own"] }, accesses: { some: { userId: "m", active: true, role: { in: ["MANAGER", "FINANCE"] } } } });
    expect(m.bookings.mock.calls[0][0].where.propertyId).toEqual({ in: ["own"] });
    expect(m.bookings.mock.calls[0][0].where.bookingStatus.in).not.toContain("CANCELLED");
    expect(m.bookings.mock.calls[0][0].where.bookingStatus.in).not.toContain("PENDING");
    expect(m.bookings.mock.calls[0][0].select).not.toHaveProperty("guestName");
  });
  it("rejects foreign properties", async () => { await expect(loadMonthlyTaxReport(2026, "foreign")).rejects.toThrow("404"); expect(m.bookings).not.toHaveBeenCalled(); });
  it("rejects owners and concierge before database reads", async () => { m.roles.mockRejectedValue(new Error("denied")); await expect(loadMonthlyTaxReport(2026)).rejects.toThrow("denied"); expect(m.properties).not.toHaveBeenCalled(); expect(m.roles).toHaveBeenCalledWith(["SUPER_ADMIN", "MANAGER", "FINANCE_ADMIN"]); });
});
