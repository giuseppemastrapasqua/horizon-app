import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ user: vi.fn(), access: vi.fn(), find: vi.fn(), read: vi.fn(), update: vi.fn(), transaction: vi.fn(), audit: vi.fn(), emit: vi.fn(), revalidate: vi.fn(), redirect: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireUser: m.user, requirePropertyRole: m.access }));
vi.mock("@/lib/prisma", () => ({ prisma: { booking: { findUnique: m.find }, $transaction: m.transaction } }));
vi.mock("@/services/audit/AuditService", () => ({ AuditService: { log: m.audit } }));
vi.mock("@/lib/events/emit", () => ({ emitEvent: m.emit }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }));
vi.mock("next/navigation", () => ({ redirect: m.redirect }));
import { cancelBooking } from "./cancel-action";

const booking = { id: "booking-1", propertyId: "property-1", ownerId: "owner-1", guestName: "Test Guest", channel: "BOOKING", bookingStatus: "CONFIRMED", statusManuallyEdited: false, checkIn: new Date("2026-11-09"), checkOut: new Date("2026-11-14") };
function form(confirm = true) { const data = new FormData(); data.set("bookingId", booking.id); if (confirm) data.set("confirmCancellation", "yes"); return data; }
beforeEach(() => {
  vi.resetAllMocks();
  m.user.mockResolvedValue({ id: "admin", role: "SUPER_ADMIN" });
  m.find.mockResolvedValue({ propertyId: booking.propertyId });
  m.read.mockResolvedValue(booking);
  m.transaction.mockImplementation(async (fn) => fn({ booking: { findUniqueOrThrow: m.read, update: m.update } }));
});
describe("manual cancellation", () => {
  it.each(["OWNER", "OPERATOR", "FINANCE_ADMIN"])("rejects %s", async (role) => {
    m.user.mockResolvedValue({ id: "user", role });
    await expect(cancelBooking(form())).rejects.toThrow("non autorizzata");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("requires explicit confirmation", async () => {
    await expect(cancelBooking(form(false))).rejects.toThrow("Conferma");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("rejects missing bookings", async () => {
    m.find.mockResolvedValue(null);
    await expect(cancelBooking(form())).rejects.toThrow("non trovata");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("enforces property access for managers", async () => {
    m.user.mockResolvedValue({ id: "manager", role: "MANAGER" });
    m.access.mockRejectedValue(new Error("Denied"));
    await expect(cancelBooking(form())).rejects.toThrow("Denied");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it("cancels without deleting or changing financial data and emits audit/event", async () => {
    await cancelBooking(form());
    expect(m.access).toHaveBeenCalledWith("property-1", ["MANAGER"]);
    expect(m.update).toHaveBeenCalledWith({ where: { id: booking.id }, data: { bookingStatus: "CANCELLED", statusManuallyEdited: true } });
    expect(m.audit).toHaveBeenCalledOnce();
    expect(m.emit).toHaveBeenCalledWith(expect.objectContaining({ eventType: "BOOKING_CANCELLED", aggregateId: booking.id }), expect.anything());
    expect(m.revalidate).toHaveBeenCalledWith("/calendar");
    expect(m.redirect).toHaveBeenCalledWith(`/bookings/${booking.id}`);
  });
  it("is idempotent", async () => {
    m.read.mockResolvedValue({ ...booking, bookingStatus: "CANCELLED", statusManuallyEdited: true });
    await cancelBooking(form());
    expect(m.update).not.toHaveBeenCalled();
    expect(m.emit).not.toHaveBeenCalled();
    expect(m.audit).not.toHaveBeenCalled();
  });
  it("does not report success when the transaction fails", async () => {
    m.audit.mockRejectedValue(new Error("Audit unavailable"));
    await expect(cancelBooking(form())).rejects.toThrow("Audit unavailable");
    expect(m.redirect).not.toHaveBeenCalled();
    expect(m.revalidate).not.toHaveBeenCalled();
  });
});
