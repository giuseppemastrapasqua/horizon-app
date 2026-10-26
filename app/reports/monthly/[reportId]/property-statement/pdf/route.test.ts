import { beforeEach, describe, expect, it, vi } from "vitest";
import { createReportBookingSnapshot } from "@/lib/finance/report-booking-snapshot";
const mocks = vi.hoisted(() => ({ user: vi.fn(), access: vi.fn(), report: vi.fn(), bookings: vi.fn(), pdf: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireUser: mocks.user, requirePropertyAccess: mocks.access }));
vi.mock("@/lib/prisma", () => ({ prisma: { financeReport: { findUnique: mocks.report }, booking: { findMany: mocks.bookings } } }));
vi.mock("@/lib/pdf/property-monthly-statement", () => ({ buildPropertyMonthlyStatementPdf: mocks.pdf }));
import { GET } from "./route";
const context = { params: Promise.resolve({ reportId: "r1" }) };
const request = () => new Request("https://example.test/reports/monthly/r1/property-statement/pdf");
const report = () => ({ id: "r1", referenceMonth: new Date("2026-10-01"), createdAt: new Date("2026-11-01"), currency: "EUR", grossRevenue: 500, finalAmount: 200, formulaSnapshot: {}, property: { id: "p1", name: "Own property", address: "Address", city: "Milano" }, owner: { fullName: "Owner" }, adjustments: [] });
beforeEach(() => { vi.resetAllMocks(); mocks.user.mockResolvedValue({ id: "owner1", role: "OWNER" }); mocks.access.mockResolvedValue({}); mocks.report.mockResolvedValue(report()); mocks.pdf.mockResolvedValue(new Uint8Array([1, 2])); });
describe("property statement access", () => {
  it.each(["OWNER", "SUPER_ADMIN", "MANAGER", "FINANCE_ADMIN"])("allows a scoped %s and marks legacy details incomplete", async (role) => {
    mocks.user.mockResolvedValue({ id: "u1", role });
    const response = await GET(request(), context);
    expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Content-Disposition")).toContain("rendiconto-mensile-proprieta-2026-10-r1.pdf");
    expect(mocks.access).toHaveBeenCalledWith("p1"); expect(mocks.pdf.mock.calls[0][0]).toMatchObject({ incomplete: true, rows: [], payable: 20000 });
    expect(mocks.bookings).not.toHaveBeenCalled();
  });
  it("rejects concierge before querying any finance data", async () => {
    mocks.user.mockResolvedValue({ id: "u1", role: "OPERATOR" });
    expect((await GET(request(), context)).status).toBe(403); expect(mocks.report).not.toHaveBeenCalled();
  });
  it("does not leak another property's document or references", async () => {
    mocks.access.mockRejectedValue(new Error("Accesso alla struttura non autorizzato."));
    expect((await GET(request(), context)).status).toBe(404); expect(mocks.pdf).not.toHaveBeenCalled(); expect(mocks.bookings).not.toHaveBeenCalled();
  });
  it("returns 404 for an absent report and 422 for corrupt saved detail", async () => {
    mocks.report.mockResolvedValueOnce(null); expect((await GET(request(), context)).status).toBe(404);
    mocks.report.mockResolvedValueOnce({ ...report(), formulaSnapshot: { bookingDetail: { version: 9 } } });
    expect((await GET(request(), context)).status).toBe(422); expect(mocks.pdf).not.toHaveBeenCalled();
  });
  it("looks up only missing booking references within the authorized property", async () => {
    const detail = createReportBookingSnapshot([{ id: "b1", checkIn: new Date("2026-10-01"), checkOut: new Date("2026-10-02"), nights: 1, guests: 2, channel: "BOOKING", currency: "EUR" }], [{ grossBooking: 500, otaCommission: 0, cleaningCost: 50, grossProperty: 450, managementCommission: 90, managementCommissionTaxableBase: 90, managementCommissionVat: 0, managementCommissionTotal: 90, taxAmount: 0, otherAmount: null, netProperty: 360 }]);
    mocks.report.mockResolvedValue({ ...report(), formulaSnapshot: { bookingDetail: detail } });
    mocks.bookings.mockResolvedValue([{ id: "b1", externalBookingId: "6480809347" }]);
    await GET(request(), context);
    expect(mocks.bookings).toHaveBeenCalledWith({ where: { propertyId: "p1", id: { in: ["b1"] } }, select: { id: true, externalBookingId: true } });
    expect(mocks.pdf.mock.calls[0][0].rows[0].reference).toBe("6480809347");
  });
});
