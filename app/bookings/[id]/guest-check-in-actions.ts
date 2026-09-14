"use server";

import { AuditAction } from "@prisma/client";
import { assertAlloggiatiSubmissionWindowOpen } from "@/lib/integrations/alloggiati-web/submission-window";
import { revalidatePath } from "next/cache";

import { requirePropertyAccess, requirePropertyRole, requireUser } from "@/lib/auth/guards";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import {
  calculateGuestCheckInLinkExpiry,
  generateGuestCheckInToken,
  hashGuestCheckInToken,
} from "@/lib/bookings/guest-check-in-token";
import {
  prepareBookingSubmission,
} from "@/lib/integrations/alloggiati-web/prepare-booking-submission";
import {
  preflightAlloggiatiSubmission,
} from "@/lib/integrations/alloggiati-web/preflight-submission";
import {
  PublicAlloggiatiReferenceProvider,
} from "@/lib/integrations/alloggiati-web/public-reference-provider";
import {
  createRuntimeAlloggiatiWebCredentialProvider,
} from "@/lib/integrations/alloggiati-web/runtime-credential-provider";
import {
  createRuntimeAlloggiatiWebValidator,
} from "@/lib/integrations/alloggiati-web/runtime-validator";
import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";
import { sendEmail } from "@/lib/notifications/email/send-email";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

const publicReferenceProvider = new PublicAlloggiatiReferenceProvider();

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

export async function verifyGuestCheckInWithAlloggiatiAction(
  bookingId: string,
) {
  const user = await requireUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      propertyId: true,
      checkIn: true,
      nights: true,
      guests: true,
      bookingGuests: {
        select: {
          role: true,
          firstName: true,
          lastName: true,
          gender: true,
          birthDate: true,
          birthCity: true,
          birthProvince: true,
          birthCountry: true,
          citizenship: true,
          documentType: true,
          documentNumber: true,
          documentIssueCountry: true,
          documentIssueCity: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error("Prenotazione non trovata.");
  }

  await requirePropertyRole(booking.propertyId, ["OWNER", "MANAGER"]);

  const connection = await prisma.alloggiatiWebProperty.findUnique({
    where: { propertyId: booking.propertyId },
    select: { apartmentId: true },
  });

  if (!connection) {
    throw new Error("Alloggiati Web non configurato per la struttura.");
  }

  const apartmentId = connection.apartmentId?.trim() || undefined;

  if (apartmentId && !/^\d+$/.test(apartmentId)) {
    throw new Error("IdAppartamento Alloggiati Web non valido.");
  }

  if (booking.nights < 1 || booking.nights > 30) {
    throw new Error("Permanenza Alloggiati non valida: deve essere tra 1 e 30 giorni.");
  }

  if (booking.guests !== booking.bookingGuests.length) {
    throw new Error("Dati ospiti Alloggiati incompleti rispetto alla prenotazione.");
  }

  const resolver = await publicReferenceProvider.getResolver();

  const submission = await prepareBookingSubmission(
    {
      checkIn: booking.checkIn,
      nights: booking.nights,
      expectedGuests: booking.guests,
      guests: booking.bookingGuests,
      apartmentId,
    },
    resolver,
  );

  const credentialProvider = createRuntimeAlloggiatiWebCredentialProvider();
  const credentials = await credentialProvider.getCredentials({
    propertyId: booking.propertyId,
  });
  const validator = createRuntimeAlloggiatiWebValidator(credentials);
  const result = await preflightAlloggiatiSubmission(submission, validator);

  await AuditService.log({
    actorId: user.id,
    action: AuditAction.UPDATE,
    propertyId: booking.propertyId,
    entityType: AUDIT_ENTITY_TYPES.BOOKING,
    entityId: booking.id,
    description: "Verifica schedina Alloggiati Web superata senza invio.",
    metadata: {
      alloggiatiWebPreflightPassed: true,
      recordsCount: submission.records.length,
    },
  });

  return {
    success: true as const,
    message: result.message?.trim() || "Verifica Alloggiati Web superata.",
  };
}

export async function enqueueGuestCheckInAlloggiatiSubmissionAction(
  bookingId: string,
) {
  const user = await requireUser();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      propertyId: true,
      checkIn: true,
      guests: true,
      bookingGuests: {
        select: { id: true },
      },
    },
  });

  if (!booking) {
    throw new Error("Prenotazione non trovata.");
  }

  await requirePropertyRole(booking.propertyId, ["OWNER", "MANAGER"]);

  assertAlloggiatiSubmissionWindowOpen(booking.checkIn);

  if (
    booking.guests < 1 ||
    booking.guests !== booking.bookingGuests.length
  ) {
    throw new Error(
      "Dati ospiti Alloggiati incompleti rispetto alla prenotazione.",
    );
  }

  const connection =
    await prisma.alloggiatiWebProperty.findUnique({
      where: { propertyId: booking.propertyId },
      select: { id: true },
    });

  if (!connection) {
    throw new Error(
      "Alloggiati Web non configurato per la struttura.",
    );
  }

  const confirmedTransmission =
    await prisma.alloggiatiWebTransmission.findFirst({
      where: {
        bookingId: booking.id,
        status: "CONFIRMED",
      },
      select: { id: true },
    });

  if (confirmedTransmission) {
    throw new Error(
      "La schedina è già stata trasmessa e confermata da Alloggiati Web.",
    );
  }

  const job = await enqueueBackgroundJob({
    type: "ALLOGGIATI_WEB_SUBMISSION",
    payload: {
      bookingId: booking.id,
      propertyId: booking.propertyId,
    },
    deduplicationKey: `alloggiati-web-submission:${booking.id}`,
    maxAttempts: 1,
  });

  await AuditService.log({
    actorId: user.id,
    action: AuditAction.UPDATE,
    propertyId: booking.propertyId,
    entityType: AUDIT_ENTITY_TYPES.BOOKING,
    entityId: booking.id,
    description: "Invio schedina Alloggiati Web accodato.",
    metadata: {
      alloggiatiWebSubmissionQueued: true,
      backgroundJobId: job.id,
    },
  });

  revalidatePath(`/bookings/${booking.id}`);

  return {
    success: true as const,
    jobId: job.id,
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
