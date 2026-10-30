import { beforeEach,expect,it,vi } from "vitest";
const m=vi.hoisted(()=>({roles:vi.fn(),bookings:vi.fn(),reports:vi.fn()}));
vi.mock("@/lib/auth/guards",()=>({requireRoles:m.roles}));
vi.mock("@/lib/prisma",()=>({prisma:{booking:{findMany:m.bookings},financeReport:{findMany:m.reports}}}));
import { loadAdminMonthlyForecast } from "./load-admin-monthly-forecast";
beforeEach(()=>{vi.resetAllMocks();m.bookings.mockResolvedValue([]);m.reports.mockResolvedValue([]);});
it("requires master admin before reading portfolio finances",async()=>{m.roles.mockRejectedValue(new Error("Forbidden"));await expect(loadAdminMonthlyForecast(2026)).rejects.toThrow("Forbidden");expect(m.bookings).not.toHaveBeenCalled();});
it("separates provisional reports and excludes cancelled and technical booking records",async()=>{m.roles.mockResolvedValue({});m.reports.mockResolvedValue([{referenceMonth:new Date("2026-10-01Z"),grossRevenue:100,finalAmount:50,formulaSnapshot:{reportState:"PROVISIONAL"}},{referenceMonth:new Date("2026-09-01Z"),grossRevenue:200,finalAmount:80,formulaSnapshot:{reportState:"CLOSED"}}]);const r=await loadAdminMonthlyForecast(2026);expect(r[9].reports).toBe(0);expect(r[8].reportedOwnerNet).toBe(80);expect(m.bookings.mock.calls[0][0].where.bookingStatus).toEqual({not:"CANCELLED"});expect(m.bookings.mock.calls[0][0].where.guestName).toEqual({not:"CLOSED"});});
