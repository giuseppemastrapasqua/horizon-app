"use server";

import {
  AuditAction,
  BookingChannel,
  Prisma,
  BookingOperationalStatus,
  BookingStatus,
} from "@prisma/client";
import { redirect } from "next/navigation";

import { requirePropertyAccess, requireUser } from "@/lib/auth/guards";
import { emitEvent } from "@/lib/events/emit";
import { processPendingEvents } from "@/lib/events/process-pending";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";

export async function createBooking(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();

  const propertyId = String(
    formData.get("propertyId") || "",
  );

  const guestName = String(
    formData.get("guestName") || "",
  ).trim();

  if (!propertyId) {
    throw new Error("Seleziona un immobile.");
  }

  await requirePropertyAccess(propertyId);

  if (!guestName) {
    throw new Error(
      "Inserisci il nome dell'ospite.",
    );
  }

  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
  });

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  const checkIn = new Date(
    String(formData.get("checkIn") || ""),
  );

  const checkOut = new Date(
    String(formData.get("checkOut") || ""),
  );

  if (
    Number.isNaN(checkIn.getTime()) ||
    Number.isNaN(checkOut.getTime())
  ) {
    throw new Error(
      "Le date della prenotazione non sono valide.",
    );
  }

  if (checkOut <= checkIn) {
    throw new Error(
      "Il check-out deve essere successivo al check-in.",
    );
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) /
      millisecondsPerDay,
  );

  const channel = parseBookingChannel(
    formData.get("channel"),
  );

  const guestEmail = optionalText(
    formData.get("guestEmail"),
  );

  const guestPhone = optionalText(
    formData.get("guestPhone"),
  );
  const guests = Number(
    formData.get("guests") || 1,
  );

  if (
    !Number.isInteger(guests) ||
    guests < 1
  ) {
    throw new Error(
      "Il numero di ospiti non è valido.",
    );
  }

  if (guests > property.maxGuests) {
    throw new Error(
      "Il numero di ospiti supera la capienza dell'immobile.",
    );
  }

  const grossAmount = Number(
    formData.get("grossAmount") || 0,
  );

  if (
    !Number.isFinite(grossAmount) ||
    grossAmount < 0
  ) {
    throw new Error(
      "L'importo della prenotazione non è valido.",
    );
  }


  const internalNotes = optionalText(
    formData.get("internalNotes"),
  );

  let booking;

  try {
    booking = await prisma.$transaction(
    async (transaction) => {
      const overlappingBooking =
        await transaction.booking.findFirst({
          where: {
            propertyId: property.id,
            bookingStatus: { not: BookingStatus.CANCELLED },
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
          select: { id: true },
        });

      if (overlappingBooking) {
        throw new Error(
          "Esiste già una prenotazione sovrapposta per questa struttura.",
        );
      }

      const createdBooking =
        await transaction.booking.create({
          data: {
            propertyId: property.id,
            ownerId: property.ownerId,
            channel,
            guestName,
            guestEmail,
            guestPhone,
            checkIn,
            checkOut,
            nights,
            guests,
            grossAmount,
            currency: "EUR",
            bookingStatus:
              BookingStatus.CONFIRMED,
            operationalStatus:
              BookingOperationalStatus.OK,
            internalNotes,
          },
        });

      await AuditService.log(
        {
          actorId:
            user.id,
          action: AuditAction.CREATE,
          propertyId: property.id,
          entityType: AUDIT_ENTITY_TYPES.BOOKING,
          entityId: createdBooking.id,
          description:
            "Prenotazione creata.",
          metadata: {
            ownerId: createdBooking.ownerId,
            guestName:
              createdBooking.guestName,
            channel: createdBooking.channel,
            checkIn:
              createdBooking.checkIn.toISOString(),
            checkOut:
              createdBooking.checkOut.toISOString(),
            nights: createdBooking.nights,
            guests: createdBooking.guests,
            grossAmount:
              createdBooking.grossAmount,
            currency:
              createdBooking.currency,
            bookingStatus:
              createdBooking.bookingStatus,
            operationalStatus:
              createdBooking.operationalStatus,
          },
        },
        transaction,
      );

      await emitEvent(
        {
          eventType: "BOOKING_CREATED",
          aggregateType: "BOOKING",
          aggregateId: createdBooking.id,
          payload: {
            bookingId: createdBooking.id,
            propertyId: createdBooking.propertyId,
            ownerId: createdBooking.ownerId,
            guestName: createdBooking.guestName,
            checkIn: createdBooking.checkIn.toISOString(),
            checkOut: createdBooking.checkOut.toISOString(),
            channel: createdBooking.channel,
          },
          idempotencyKey: `BOOKING_CREATED:${createdBooking.id}`,
        },
        transaction,
      );

      return createdBooking;
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    },
  );

  } catch (error) {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      throw new Error(
        "La disponibilità è cambiata mentre salvavi la prenotazione. Riprova.",
      );
    }

    throw error;
  }

  await processPendingEvents({
    limit: 20,
  });

  redirect(`/properties/${property.id}`);
}

export async function setBookingOperationalStatus(
  bookingId: string,
  operationalStatus:
    | "OK"
    | "DOCUMENTS_PENDING"
    | "CLEANING_PENDING",
): Promise<void> {
  const user = await requireUser();

  const target = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { propertyId: true },
  });

  if (!target) {
    throw new Error("Prenotazione non trovata.");
  }

  await requirePropertyAccess(target.propertyId);

  const booking = await prisma.$transaction(
    async (transaction) => {
      const existingBooking =
        await transaction.booking.findUnique({
          where: {
            id: bookingId,
          },
          select: {
            id: true,
            propertyId: true,
            operationalStatus: true,
          },
        });

      if (!existingBooking) {
        throw new Error(
          "Prenotazione non trovata.",
        );
      }

      if (
        existingBooking.operationalStatus ===
        operationalStatus
      ) {
        return existingBooking;
      }

      const updatedBooking =
        await transaction.booking.update({
          where: {
            id: bookingId,
          },
          data: {
            operationalStatus,
          },
          select: {
            id: true,
            propertyId: true,
            operationalStatus: true,
          },
        });

      await AuditService.log(
        {
          actorId:
            user.id,
          action: AuditAction.UPDATE,
          propertyId:
            updatedBooking.propertyId,
          entityType: AUDIT_ENTITY_TYPES.BOOKING,
          entityId: updatedBooking.id,
          description:
            "Stato operativo della prenotazione aggiornato.",
          metadata: {
            previousOperationalStatus:
              existingBooking.operationalStatus,
            newOperationalStatus:
              updatedBooking.operationalStatus,
          },
        },
        transaction,
      );

      return updatedBooking;
    },
  );

  redirect(`/bookings/${booking.id}`);
}

function parseBookingChannel(
  value: FormDataEntryValue | null,
): BookingChannel {
  const channel = String(value || "DIRECT");

  switch (channel) {
    case "AIRBNB":
      return BookingChannel.AIRBNB;

    case "BOOKING":
      return BookingChannel.BOOKING;

    case "VRBO":
      return BookingChannel.VRBO;

    case "OTHER":
      return BookingChannel.OTHER;

    default:
      return BookingChannel.DIRECT;
  }
}

function optionalText(
  value: FormDataEntryValue | null,
): string | null {
  const text = String(value || "").trim();

  return text || null;
}