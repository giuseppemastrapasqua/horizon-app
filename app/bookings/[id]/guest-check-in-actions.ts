"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requirePropertyAccess, requireUser } from "@/lib/auth/guards";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import {
  calculateGuestCheckInLinkExpiry,
  generateGuestCheckInToken,
  hashGuestCheckInToken,
} from "@/lib/bookings/guest-check-in-token";
import { sendEmail } from "@/lib/notifications/email/send-email";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

function getBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return new URL(configuredUrl).origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL non configurata.");
  }

  return "http://localhost:3000";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function prepareGuestCheckInLink(bookingId: string) {
  const user = await requireUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      propertyId: true,
      guestName: true,
      guestEmail: true,
      checkOut: true,
      property: {
        select: { name: true },
      },
    },
  });

  if (!booking) {
    throw new Error("Prenotazione non trovata.");
  }

  await requirePropertyAccess(booking.propertyId);

  const token = generateGuestCheckInToken();
  const tokenHash = hashGuestCheckInToken(token);
  const expiresAt = calculateGuestCheckInLinkExpiry(booking.checkOut);

  if (expiresAt.getTime() <= Date.now()) {
    throw new Error("Il soggiorno è concluso e il link schedina non può più essere generato.");
  }

  return {
    user,
    booking,
    tokenHash,
    expiresAt,
    url: new URL(`/check-in/${token}`, getBaseUrl()).toString(),
  };
}

async function persistGuestCheckInLink(
  prepared: Awaited<ReturnType<typeof prepareGuestCheckInLink>>,
) {
  await prisma.$transaction(async (transaction) => {
    const previous = await transaction.guestCheckInLink.findUnique({
      where: { bookingId: prepared.booking.id },
      select: { id: true },
    });

    await transaction.guestCheckInLink.upsert({
      where: { bookingId: prepared.booking.id },
      create: {
        bookingId: prepared.booking.id,
        tokenHash: prepared.tokenHash,
        expiresAt: prepared.expiresAt,
      },
      update: {
        tokenHash: prepared.tokenHash,
        expiresAt: prepared.expiresAt,
        revokedAt: null,
      },
    });

    await AuditService.log(
      {
        actorId: prepared.user.id,
        action: previous ? AuditAction.UPDATE : AuditAction.CREATE,
        propertyId: prepared.booking.propertyId,
        entityType: AUDIT_ENTITY_TYPES.BOOKING,
        entityId: prepared.booking.id,
        description: previous
          ? "Link schedina ospiti rigenerato."
          : "Link schedina ospiti generato.",
        metadata: {
          guestCheckInLinkGenerated: true,
          regenerated: Boolean(previous),
          expiresAt: prepared.expiresAt.toISOString(),
        },
      },
      transaction,
    );
  });
}

export async function generateGuestCheckInLinkAction(bookingId: string) {
  const prepared = await prepareGuestCheckInLink(bookingId);
  await persistGuestCheckInLink(prepared);

  revalidatePath(`/bookings/${prepared.booking.id}`);

  return {
    success: true as const,
    url: prepared.url,
    expiresAt: prepared.expiresAt.toISOString(),
  };
}

export async function sendGuestCheckInEmailAction(bookingId: string) {
  const prepared = await prepareGuestCheckInLink(bookingId);
  const guestEmail = prepared.booking.guestEmail?.trim();

  if (!guestEmail) {
    throw new Error("La prenotazione non contiene un indirizzo email ospite.");
  }

  const propertyName = escapeHtml(prepared.booking.property.name);
  const guestName = escapeHtml(prepared.booking.guestName);
  const checkInUrl = escapeHtml(prepared.url);

  await sendEmail({
    to: guestEmail,
    subject: `Dati ospiti per il soggiorno - ${prepared.booking.property.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <p>Ciao ${guestName},</p>
        <p>per completare la registrazione del soggiorno presso <strong>${propertyName}</strong>, inserisci i dati degli ospiti tramite il link sicuro seguente.</p>
        <p><a href="${checkInUrl}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px">Compila i dati ospiti</a></p>
        <p>Se il pulsante non funziona, copia questo indirizzo nel browser:</p>
        <p style="overflow-wrap:anywhere">${checkInUrl}</p>
        <p>Il link scade il ${prepared.expiresAt.toLocaleString("it-IT")}.</p>
      </div>
    `,
  });

  await persistGuestCheckInLink(prepared);

  await AuditService.log({
    actorId: prepared.user.id,
    action: AuditAction.UPDATE,
    propertyId: prepared.booking.propertyId,
    entityType: AUDIT_ENTITY_TYPES.BOOKING,
    entityId: prepared.booking.id,
    description: "Email schedina ospiti inviata.",
    metadata: {
      guestCheckInEmailSent: true,
      expiresAt: prepared.expiresAt.toISOString(),
    },
  });

  revalidatePath(`/bookings/${prepared.booking.id}`);

  return {
    success: true as const,
    expiresAt: prepared.expiresAt.toISOString(),
  };
}

export async function revokeGuestCheckInLinkAction(bookingId: string) {
  const user = await requireUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, propertyId: true },
  });

  if (!booking) {
    throw new Error("Prenotazione non trovata.");
  }

  await requirePropertyAccess(booking.propertyId);

  await prisma.$transaction(async (transaction) => {
    const result = await transaction.guestCheckInLink.updateMany({
      where: {
        bookingId: booking.id,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) {
      return;
    }

    await AuditService.log(
      {
        actorId: user.id,
        action: AuditAction.UPDATE,
        propertyId: booking.propertyId,
        entityType: AUDIT_ENTITY_TYPES.BOOKING,
        entityId: booking.id,
        description: "Link schedina ospiti revocato.",
        metadata: { guestCheckInLinkRevoked: true },
      },
      transaction,
    );
  });

  revalidatePath(`/bookings/${booking.id}`);

  return { success: true as const };
}
