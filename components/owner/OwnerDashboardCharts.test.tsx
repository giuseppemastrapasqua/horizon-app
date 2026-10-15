import React from "react";
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ bookings: vi.fn().mockResolvedValue([]), reports: vi.fn().mockResolvedValue([]) }));
vi.mock("@/lib/prisma", () => ({ prisma: { booking: { findMany: mocks.bookings }, financeReport: { findMany: mocks.reports } } }));
import { OwnerDashboardCharts } from "./OwnerDashboardCharts";
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });
it("restricts both queries to owner properties and does not load guest identity or internal data", async () => {
  vi.stubGlobal("React", React);
  await OwnerDashboardCharts({ propertyIds: ["own"], now: new Date("2026-10-15") });
  for (const query of [mocks.bookings, mocks.reports]) expect(query.mock.calls[0][0].where.propertyId).toEqual({ in: ["own"] });
  expect(mocks.bookings.mock.calls[0][0].where.bookingStatus.in).toEqual(["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"]);
  expect(mocks.bookings.mock.calls[0][0].select).not.toHaveProperty("guestName");
  expect(mocks.bookings.mock.calls[0][0].select).not.toHaveProperty("internalNotes");
});
it("does not query any data for an unassigned owner", async () => {
  expect(await OwnerDashboardCharts({ propertyIds: [], now: new Date() })).toBeNull();
  expect(mocks.bookings).not.toHaveBeenCalled();
  expect(mocks.reports).not.toHaveBeenCalled();
});
