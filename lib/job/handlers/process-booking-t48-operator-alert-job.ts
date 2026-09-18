import {
  BookingStatus,
  PropertyTaskAssignmentRole,
  RecordStatus,
  type BackgroundJob,
} from "@prisma/client";

import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";
import { sendEmail } from "@/lib/notifications/email/send-email";
import { prisma } from "@/lib/prisma";

const T48_MILLISECONDS = 48 * 60 * 60 * 1000;

type BookingT48Payload = {
  bookingId?: string;
  scheduledCheckIn?: string;
};

function escapeHtml(
  value: string,
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getBaseUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL;

  if (configured) {
    return new URL(configured).origin;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL non configurata.",
    );
  }

  return "http://localhost:3000";
}

export async function processBookingT48OperatorAlertJob(
  job: BackgroundJob,
): Promise<void> {
  const payload =
    job.payload as BookingT48Payload;

  if (
    !payload.bookingId ||
    !payload.scheduledCheckIn
  ) {
    throw new Error(
      "Job BOOKING_T48_OPERATOR_ALERT con payload non valido.",
    );
  }

  const booking =
    await prisma.booking.findUnique({
      where: {
        id: payload.bookingId,
      },
      select: {
        id: true,
        propertyId: true,
        guestName: true,
        checkIn: true,
        bookingStatus: true,
        property: {
          select: {
            name: true,
          },
        },
      },
    });

  if (!booking) {
    return;
  }

  if (
    booking.bookingStatus === BookingStatus.CANCELLED ||
    booking.bookingStatus === BookingStatus.CHECKED_OUT
  ) {
    return;
  }

  /*
   * Se il check-in è stato modificato dopo la creazione
   * di questo job, il job è obsoleto.
   *
   * Il BOOKING_UPDATED avrà già schedulato il job corretto.
   */
  if (
    booking.checkIn.toISOString() !==
    payload.scheduledCheckIn
  ) {
    return;
  }

  const now = new Date();

  if (
    booking.checkIn.getTime() <=
    now.getTime()
  ) {
    return;
  }

  const targetTime =
    booking.checkIn.getTime() -
    T48_MILLISECONDS;

  /*
   * Difesa ulteriore:
   * se il worker eseguisse anticipatamente il job,
   * lo rimettiamo in coda per il momento corretto.
   */
  if (now.getTime() < targetTime) {
    await enqueueBackgroundJob({
      type: "BOOKING_T48_OPERATOR_ALERT",
      payload: {
        bookingId: booking.id,
        scheduledCheckIn:
          booking.checkIn.toISOString(),
      },
      availableAt: new Date(targetTime),
      deduplicationKey:
        `BOOKING_T48_OPERATOR_ALERT:${booking.id}:${booking.checkIn.toISOString()}`,
    });

    return;
  }

  const assignment =
    await prisma.propertyTaskAssignment.findFirst({
      where: {
        propertyId: booking.propertyId,
        role: PropertyTaskAssignmentRole.OPERATIONS,
        active: true,
        user: {
          role: "OPERATOR",
          status: RecordStatus.ACTIVE,
        },
      },
      select: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

  if (!assignment?.user.email) {
    /*
     * Nessun destinatario operativo configurato:
     * non inviamo a utenti casuali e non esponiamo
     * la prenotazione a collaboratori non assegnati.
     */
    return;
  }

  const bookingUrl =
    new URL(
      `/bookings/${booking.id}`,
      getBaseUrl(),
    ).toString();

  const checkInLabel =
    new Intl.DateTimeFormat(
      "it-IT",
      {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Europe/Rome",
      },
    ).format(booking.checkIn);

  const operatorName =
    escapeHtml(assignment.user.fullName);

  const propertyName =
    escapeHtml(booking.property.name);

  const guestName =
    escapeHtml(booking.guestName);

  await sendEmail({
    to: assignment.user.email,
    subject:
      `Horizon · Check-in da gestire · ${booking.property.name}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#0f172a">
        <div style="padding:24px 0;border-bottom:1px solid #e2e8f0">
          <div style="font-size:22px;font-weight:800;color:#2563eb">
            Horizon
          </div>
          <div style="margin-top:4px;font-size:12px;color:#64748b">
            Operatività check-in · T−48
          </div>
        </div>

        <div style="padding:28px 0">
          <p style="margin:0 0 8px;font-size:13px;color:#64748b">
            Ciao ${operatorName},
          </p>

          <h1 style="margin:0;font-size:24px;line-height:1.25">
            Check-in da preparare
          </h1>

          <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#475569">
            La prenotazione entra nella finestra operativa delle 48 ore.
            Apri Horizon, verifica la prenotazione e invia manualmente
            all'ospite il link sicuro per il check-in.
          </p>

          <div style="margin-top:24px;padding:18px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc">
            <p style="margin:0 0 8px;font-size:13px">
              <strong>Struttura:</strong> ${propertyName}
            </p>

            <p style="margin:0 0 8px;font-size:13px">
              <strong>Ospite:</strong> ${guestName}
            </p>

            <p style="margin:0;font-size:13px">
              <strong>Arrivo:</strong> ${escapeHtml(checkInLabel)}
            </p>
          </div>

          <a
            href="${bookingUrl}"
            style="display:inline-block;margin-top:24px;padding:12px 18px;border-radius:10px;background:#2563eb;color:#fff;text-decoration:none;font-size:14px;font-weight:700"
          >
            Apri prenotazione in Horizon
          </a>

          <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#64748b">
            Il link ospite non viene inviato in questa email.
            Copialo dalla prenotazione Horizon e condividilo
            attraverso il canale utilizzato con l'ospite.
          </p>
        </div>

        <div style="padding:18px 0;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8">
          Horizon Property Management OS
        </div>
      </div>
    `,
  });
}
