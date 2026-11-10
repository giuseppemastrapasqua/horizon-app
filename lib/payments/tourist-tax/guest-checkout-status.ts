import { prisma } from "@/lib/prisma";
import { PrismaBookingTaxSnapshotRepository } from "@/lib/payments/tourist-tax/prisma-booking-tax-snapshot-repository";
import { PrismaTouristTaxPaymentRepository } from "@/lib/payments/tourist-tax/prisma-tourist-tax-payment-repository";

export async function resolveSubmittedGuestTouristTax(bookingId: string, guestCount: number) {
  const payments = new PrismaTouristTaxPaymentRepository(prisma);
  if (await payments.findPaidByBookingId(bookingId)) {
    return { status: "PAID" as const };
  }

  const snapshot = await new PrismaBookingTaxSnapshotRepository().findById(bookingId);
  if (!snapshot || snapshot.guests.length !== guestCount || guestCount === 0) {
    return { status: "UNAVAILABLE" as const };
  }

  let total = 0;
  for (const guest of snapshot.guests) {
    const item = guest.classification;
    if (!item || item.status !== "CLASSIFIED" || item.taxAmount === null ||
        !Number.isFinite(item.taxAmount) || item.taxAmount < 0) {
      return { status: "UNAVAILABLE" as const };
    }
    total += item.taxAmount;
  }

  const amount = Math.round((total + Number.EPSILON) * 100);
  if (amount === 0) return { status: "NOT_DUE" as const };

  const payment = await payments.findPendingByBookingId(bookingId);
  if (payment?.provider !== "STRIPE" || payment.currency !== "EUR" ||
      !payment.providerPaymentId || !payment.paymentUrl || !payment.expiresAt ||
      payment.expiresAt.getTime() <= Date.now() ||
      Math.round(payment.amount * 100) !== amount) {
    return { status: "UNAVAILABLE" as const };
  }

  const checkout = new URL(payment.paymentUrl);
  if (checkout.origin !== "https://checkout.stripe.com" ||
      checkout.username || checkout.password || !checkout.pathname.startsWith("/c/pay/")) {
    return { status: "UNAVAILABLE" as const };
  }

  return { status: "READY" as const, amount: amount / 100, url: checkout.href };
}
