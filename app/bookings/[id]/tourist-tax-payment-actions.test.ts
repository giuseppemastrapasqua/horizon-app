import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ roles: vi.fn(), access: vi.fn(), booking: vi.fn(), payment: vi.fn(), create: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireRoles: m.roles, requirePropertyRole: m.access }));
vi.mock("@/lib/prisma", () => ({ prisma: { booking: { findUnique: m.booking }, touristTaxPayment: { findFirst: m.payment } } }));
vi.mock("@/lib/payments/tourist-tax/booking-payment-service", () => ({ createBookingTouristTaxPayment: m.create }));
vi.mock("@/lib/payments/tourist-tax/prisma-booking-tax-snapshot-repository", () => ({ PrismaBookingTaxSnapshotRepository: class {} }));
vi.mock("@/lib/payments/tourist-tax/prisma-tourist-tax-payment-repository", () => ({ PrismaTouristTaxPaymentRepository: class {} }));
vi.mock("@/lib/payments/tourist-tax/stripe-provider", () => ({ createStripeTouristTaxPaymentProvider: () => ({}) }));
vi.mock("@/lib/notifications/email/send-email", () => ({ sendEmail: m.send }));
import { createTouristTaxCheckoutAction, getTouristTaxPaymentStatusAction, sendTouristTaxPaymentEmailAction } from "./tourist-tax-payment-actions";
describe("concierge tourist tax links", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.roles.mockResolvedValue({ id: "operator", role: "OPERATOR" });
    m.access.mockResolvedValue({ id: "operator" });
    m.booking.mockResolvedValue({ id: "booking", propertyId: "own", guestEmail: "guest@example.com", property: { name: '<Alloggio "A">' } });
    m.create.mockResolvedValue({ outcome: "CREATED", payment: { paymentUrl: "https://checkout.stripe.com/test" } });
  });
  it("allows assigned operators to create a link", async () => {
    expect(await createTouristTaxCheckoutAction("booking")).toEqual({ status: "PENDING", paymentUrl: "https://checkout.stripe.com/test" });
    expect(m.roles).toHaveBeenCalledWith(["SUPER_ADMIN", "MANAGER", "OPERATOR"]);
    expect(m.access).toHaveBeenCalledWith("own", ["MANAGER", "OPERATOR"]);
  });
  it.each([createTouristTaxCheckoutAction, getTouristTaxPaymentStatusAction, sendTouristTaxPaymentEmailAction])("denies foreign properties before payment access", async (action) => {
    m.access.mockRejectedValue(new Error("denied"));
    await expect(action("foreign")).rejects.toThrow("denied");
    expect(m.create).not.toHaveBeenCalled();
    expect(m.payment).not.toHaveBeenCalled();
    expect(m.send).not.toHaveBeenCalled();
  });
  it("sends only to the booking guest and escapes property names", async () => {
    await sendTouristTaxPaymentEmailAction("booking");
    expect(m.send.mock.calls[0][0].to).toBe("guest@example.com");
    expect(m.send.mock.calls[0][0].html).toContain("&lt;Alloggio &quot;A&quot;&gt;");
    expect(m.send.mock.calls[0][0].html).toContain("https://checkout.stripe.com/test");
  });
  it("does not create checkout without an email", async () => {
    m.booking.mockResolvedValue({ id: "booking", propertyId: "own", guestEmail: null });
    await expect(sendTouristTaxPaymentEmailAction("booking")).rejects.toThrow("indirizzo email");
    expect(m.create).not.toHaveBeenCalled();
  });
  it("does not email a paid booking", async () => {
    m.create.mockResolvedValue({ outcome: "ALREADY_PAID" });
    await expect(sendTouristTaxPaymentEmailAction("booking")).rejects.toThrow("già pagata");
    expect(m.send).not.toHaveBeenCalled();
  });
  it("does not send when fiscal classification blocks payment", async () => {
    m.create.mockRejectedValue(new Error("classification incomplete"));
    await expect(sendTouristTaxPaymentEmailAction("booking")).rejects.toThrow("classification incomplete");
    expect(m.send).not.toHaveBeenCalled();
  });
  it("rejects owner role before loading booking data", async () => {
    m.roles.mockRejectedValue(new Error("denied"));
    await expect(createTouristTaxCheckoutAction("booking")).rejects.toThrow("denied");
    expect(m.booking).not.toHaveBeenCalled();
  });
});
