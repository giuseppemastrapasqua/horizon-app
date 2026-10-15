import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ roles: vi.fn(), scope: vi.fn(), properties: vi.fn(), bookings: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireRoles: mocks.roles, getAccessiblePropertyIds: mocks.scope }));
vi.mock("@/lib/prisma", () => ({ prisma: { property: { findMany: mocks.properties }, booking: { findMany: mocks.bookings } } }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("404"); } }));
import { getCleaningReport } from "./get-cleaning-report";
describe("cleaning report", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.scope.mockResolvedValue(["own"]);
    mocks.properties.mockResolvedValue([{ id: "own", name: "Alloggio", cleaningCost: "60.15" }]);
    mocks.bookings.mockResolvedValue([]);
  });
  it("limits queries to assigned properties and the checkout month without financial or guest data", async () => {
    await getCleaningReport("2026-10");
    expect(mocks.properties.mock.calls[0][0].where).toEqual({ id: { in: ["own"] } });
    const query = mocks.bookings.mock.calls[0][0];
    expect(query.where).toEqual({ propertyId: { in: ["own"] }, checkOut: { gte: new Date("2026-10-01Z"), lt: new Date("2026-11-01Z") }, bookingStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] } });
    expect(Object.keys(query.select).sort()).toEqual(["checkIn", "checkOut", "id", "propertyId"]);
  });
  it("rejects foreign properties before querying bookings", async () => {
    await expect(getCleaningReport("2026-10", "foreign")).rejects.toThrow("404");
    expect(mocks.bookings).not.toHaveBeenCalled();
  });
  it("counts each stay once and sums in integer cents", async () => {
    mocks.bookings.mockResolvedValue([1, 2, 3].map((id) => ({ id: String(id), propertyId: "own", checkIn: new Date("2026-09-28Z"), checkOut: new Date("2026-10-02Z") })));
    const result = await getCleaningReport("2026-10");
    expect(result.totalCents).toBe(18045);
    expect(result.rows).toHaveLength(3);
  });
  it("denies unauthorized roles before reading data", async () => {
    mocks.roles.mockRejectedValue(new Error("denied"));
    await expect(getCleaningReport("2026-10")).rejects.toThrow("denied");
    expect(mocks.roles).toHaveBeenCalledWith(["SUPER_ADMIN", "MANAGER", "OPERATOR"]);
    expect(mocks.properties).not.toHaveBeenCalled();
  });
  it("rejects malformed periods", async () => {
    await expect(getCleaningReport("2026-13")).rejects.toThrow("404");
  });
});
