"use server";

import {
  requirePropertyRole,
  requireRoles,
} from "@/lib/auth/guards";
import { createBookingTouristTaxPayment } from "@/lib/payments/tourist-tax/booking-payment-service";
import { PrismaBookingTaxSnapshotRepository } from "@/lib/payments/tourist-tax/prisma-booking-tax-snapshot-repository";
import { PrismaTouristTaxPaymentRepository } from "@/lib/payments/tourist-tax/prisma-tourist-tax-payment-repository";
import { createStripeTouristTaxPaymentProvider } from "@/lib/payments/tourist-tax/stripe-provider";
import { sendEmail } from "@/lib/notifications/email/send-email";
import { prisma } from "@/lib/prisma";

async function requireBookingAccess(bookingId: string) {
  await requireRoles(["SUPER_ADMIN", "MANAGER", "OPERATOR"]);

  if (
    typeof bookingId !== "string" ||
    bookingId.trim().length === 0
  ) {
    throw new Error("Prenotazione non valida.");
  }

  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    select: {
      id: true,
      propertyId: true,
    },
  });

  if (!booking) {
    throw new Error("Prenotazione non trovata.");
  }

  await requirePropertyRole(
    booking.propertyId,
    ["MANAGER", "OPERATOR"],
  );

  return booking;
}

export async function getTouristTaxPaymentStatusAction(
  bookingId: string,
) {
  const booking = await requireBookingAccess(bookingId);

  const paid = await prisma.touristTaxPayment.findFirst({
    where: {
      bookingId: booking.id,
      status: "PAID",
    },
    orderBy: {
      paidAt: "desc",
    },
    select: {
      status: true,
      amount: true,
      paidAt: true,
    },
  });

  if (paid) {
    return {
      status: "PAID" as const,
      amount: Number(paid.amount),
      paidAt: paid.paidAt,
      paymentUrl: null,
    };
  }

  const pending = await prisma.touristTaxPayment.findFirst({
    where: {
      bookingId: booking.id,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      status: true,
      amount: true,
      expiresAt: true,
      paymentUrl: true,
    },
  });

  if (pending) {
    return {
      status: "PENDING" as const,
      amount: Number(pending.amount),
      expiresAt: pending.expiresAt,
      paymentUrl: pending.paymentUrl,
    };
  }

  return {
    status: "NOT_CREATED" as const,
    amount: null,
    paymentUrl: null,
  };
}

export async function createTouristTaxCheckoutAction(
  bookingId: string,
) {
  const booking = await requireBookingAccess(bookingId);

  const result = await createBookingTouristTaxPayment({
    bookingId: booking.id,
    bookingRepository:
      new PrismaBookingTaxSnapshotRepository(),
    paymentRepository:
      new PrismaTouristTaxPaymentRepository(prisma),
    provider:
      createStripeTouristTaxPaymentProvider(),
  });

  if (result.outcome === "NOTHING_TO_PAY") {
    throw new Error(
      "Nessuna imposta di soggiorno da incassare.",
    );
  }

  if (result.outcome === "ALREADY_PAID") {
    return {
      status: "PAID" as const,
      paymentUrl: null,
    };
  }

  if (!result.payment.paymentUrl) {
    throw new Error(
      "Il pagamento non dispone di un URL Checkout.",
    );
  }

  return {
    status: "PENDING" as const,
    paymentUrl: result.payment.paymentUrl,
  };
}

export async function sendTouristTaxPaymentEmailAction(bookingId: string) {
  const reference = await requireBookingAccess(bookingId);
  const booking = await prisma.booking.findUnique({
    where: { id: reference.id },
    select: { guestEmail: true, property: { select: { name: true } } },
  });
  const to = booking?.guestEmail?.trim();
  if (!to) throw new Error("La prenotazione non contiene un indirizzo email ospite.");
  const result = await createTouristTaxCheckoutAction(reference.id);
  if (result.status === "PAID") throw new Error("Imposta già pagata: nessuna email inviata.");
  const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  await sendEmail({
    to,
    subject: `Imposta di soggiorno - ${booking!.property.name}`,
    html: `<p>Per il soggiorno presso <strong>${escape(booking!.property.name)}</strong>, puoi pagare l’imposta di soggiorno tramite il seguente link sicuro.</p><p><a href="${escape(result.paymentUrl)}">Paga l’imposta di soggiorno</a></p>`,
  });
  return { success: true as const };
}
