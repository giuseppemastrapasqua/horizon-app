import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ roles: vi.fn(), reports: vi.fn(), documents: vi.fn(), bookings: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireRoles: mocks.roles }));
vi.mock("@/lib/prisma", () => ({ prisma: { financeReport: { findMany: mocks.reports }, document: { findMany: mocks.documents }, booking: { findMany: mocks.bookings } } }));
import { loadAutomaticAccounting } from "./load-automatic";
const invoice = { id: "i", propertyId: "p", property: { name: "Test" }, referenceMonth: new Date("2026-10-01Z"), status: "DRAFT", content: { kind: "COMMISSION_INVOICE", commission: { taxableBase: 100, vat: 0, total: 100, currency: "EUR" } } };
beforeEach(() => { vi.resetAllMocks(); mocks.roles.mockResolvedValue({ id: "admin" }); mocks.reports.mockResolvedValue([]); mocks.documents.mockResolvedValue([]); mocks.bookings.mockResolvedValue([]); });
it("checks admin access before querying sources", async () => {
  mocks.roles.mockRejectedValue(new Error("Forbidden"));
  await expect(loadAutomaticAccounting(2026)).rejects.toThrow("Forbidden");
  expect(mocks.roles).toHaveBeenCalledWith(["SUPER_ADMIN"]); expect(mocks.reports).not.toHaveBeenCalled();
});
it("uses document month and checkout year, ignores archived invoices and counts cleaning only once per booking", async () => {
  mocks.documents.mockResolvedValue([invoice]);
  mocks.bookings.mockResolvedValue([{ id: "b", checkOut: new Date("2026-10-23Z"), property: { name: "Test", cleaningCost: 50 } }]);
  const loaded = await loadAutomaticAccounting(2026);
  expect(loaded.cleaning).toEqual([{ id: "b", propertyName: "Test", date: "2026-10-23", amount: 5000 }]);
  expect(mocks.documents.mock.calls[0][0].where.status).toEqual({ not: "ARCHIVED" });
  expect(mocks.bookings.mock.calls[0][0].where).toEqual({ checkOut: { gte: new Date("2026-01-01Z"), lt: new Date("2027-01-01Z") }, bookingStatus: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] } });
});
it("does not sum multiple versions/documents for the same property and month", async () => {
  mocks.documents.mockResolvedValue([invoice, { ...invoice, id: "older" }]);
  const loaded = await loadAutomaticAccounting(2026);
  expect(loaded.invoices).toHaveLength(1); expect(loaded.warnings[0]).toContain("duplicata");
});
it("exposes legacy missing F24/OTA and missing invoices instead of inventing totals", async () => {
  mocks.reports.mockResolvedValue([{ id: "r", propertyId: "p", property: { name: "Test" }, referenceMonth: new Date("2026-10-01Z"), currency: "EUR", grossRevenue: 1000, finalAmount: 400, formulaSnapshot: {}, rules: [], adjustments: [{ amount: 10 }] }]);
  const loaded = await loadAutomaticAccounting(2026);
  expect(loaded.reports[0]).toMatchObject({ gross: 100000, ownerNet: 41000, ota: null, f24: null });
  expect(loaded.warnings).toHaveLength(2);
});
