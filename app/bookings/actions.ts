"use server";

import {
  AuditAction,
  BookingChannel,
  Prisma,
  BookingOperationalStatus,
  BookingStatus,
} from "@prisma/client";
import { redirect } from "next/navigation";

import { requirePropertyAccess, requirePropertyRole, requireUser } from "@/lib/auth/guards";
import { createBookingUpdateFingerprint } from "@/lib/bookings/booking-update-fingerprint";
import { emitEvent } from "@/lib/events/emit";
import { processPendingEvents } from "@/lib/events/process-pending";
import { prisma } from "@/lib/prisma";
import { findOrCreateGuest } from "@/lib/guests";
import { AuditService } from "@/services/audit/AuditService";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";

export async function createBooking(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  if (user.role === "OWNER") throw new Error("Operazione non autorizzata.");

  const propertyId = String(
    formData.get("propertyId") || "",
  );

  const guestName = String(
    formData.get("guestName") || "",
  ).trim();

  if (!propertyId) {
    throw new Error("Seleziona un immobile.");
  }

  await requirePropertyRole(propertyId, ["MANAGER"]);

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

  const roomsBooked = Number(formData.get("roomsBooked"));

  if (!Number.isInteger(roomsBooked) || roomsBooked < 1) {
    throw new Error("Il numero di camere prenotate non è valido.");
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

  const bookedAt = new Date();

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

      const blockedPeriod = await transaction.propertyAvailabilityBlock.findFirst({
        where: { propertyId: property.id, startDate: { lt: checkOut }, endDate: { gte: checkIn } },
        select: { id: true },
      });
      if (blockedPeriod) throw new Error("Il periodo contiene giorni non disponibili.");

      const createdBooking =
        await transaction.booking.create({
          data: {
            propertyId: property.id,
            ownerId: property.ownerId,
            channel,
            guestName,
            guestEmail,
            guestPhone,
            bookedAt,
            checkIn,
            checkOut,
            nights,
            guests,
            roomsBooked,
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
            roomsBooked: createdBooking.roomsBooked,
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

export async function updateBookingDetails(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  if (user.role === "OWNER") throw new Error("Operazione non autorizzata.");

  const bookingId = String(
    formData.get("bookingId") || "",
  ).trim();

  if (!bookingId) {
    throw new Error("Prenotazione non trovata.");
  }

  const existingBooking =
    await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        propertyId: true,
        ownerId: true,
        integrationConnectionId: true,
        channel: true,
        checkIn: true,
        checkOut: true,
        nights: true,
        bookingStatus: true,
        guestId: true,
        guestName: true,
        guestEmail: true,
        guestPhone: true,
        guests: true,
        roomsBooked: true,
        grossAmount: true,
        currency: true,
        property: {
          select: {
            maxGuests: true,
          },
        },
      },
    });

  if (!existingBooking) {
    throw new Error("Prenotazione non trovata.");
  }

  await requirePropertyRole(
    existingBooking.propertyId,
    ["MANAGER"],
  );

  const guestName = String(
    formData.get("guestName") || "",
  ).trim();

  const guestEmail = optionalText(
    formData.get("guestEmail"),
  );

  const guestPhone = optionalText(
    formData.get("guestPhone"),
  );

  const guests = Number(
    formData.get("guests") || 0,
  );

  const roomsBooked = Number(formData.get("roomsBooked"));

  if (!Number.isInteger(roomsBooked) || roomsBooked < 1) {
    throw new Error("Il numero di camere prenotate non è valido.");
  }

  const grossAmount = Number(
    formData.get("grossAmount") || 0,
  );

  const currency = String(
    formData.get("currency") || "",
  )
    .trim()
    .toUpperCase();

  if (!guestName) {
    throw new Error(
      "Inserisci il nome dell'ospite.",
    );
  }

  if (
    !Number.isInteger(guests) ||
    guests < 1
  ) {
    throw new Error(
      "Il numero di ospiti non è valido.",
    );
  }

  if (
    guests >
    existingBooking.property.maxGuests
  ) {
    throw new Error(
      "Il numero di ospiti supera la capienza dell'immobile.",
    );
  }

  if (
    !Number.isFinite(grossAmount) ||
    grossAmount < 0
  ) {
    throw new Error(
      "L'importo della prenotazione non è valido.",
    );
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error(
      "La valuta deve essere un codice di 3 lettere.",
    );
  }

  await prisma.$transaction(
    async (transaction) => {
      const { guest } =
        await findOrCreateGuest(
          {
            fullName: guestName,
            email: guestEmail,
            phone: guestPhone,
          },
          transaction,
        );

      const hasChanges =
        existingBooking.guestId !== guest.id ||
        existingBooking.guestName !== guestName ||
        existingBooking.guestEmail !== guestEmail ||
        existingBooking.guestPhone !== guestPhone ||
        existingBooking.guests !== guests ||
        (existingBooking.roomsBooked ?? null) !== roomsBooked ||
        Number(existingBooking.grossAmount) !== grossAmount ||
        existingBooking.currency !== currency;

      if (hasChanges) {
        const updatedBooking =
          await transaction.booking.update({
            where: {
              id: existingBooking.id,
            },
            data: {
              guestId: guest.id,
              guestName,
              guestEmail,
              guestPhone,
              guests,
              roomsBooked,
              grossAmount,
              currency,
              guestDataManuallyEdited: true,
              pricingDataManuallyEdited: true,
            },
          });

        await AuditService.log(
          {
            actorId: user.id,
            action: AuditAction.UPDATE,
            propertyId:
              existingBooking.propertyId,
            entityType:
              AUDIT_ENTITY_TYPES.BOOKING,
            entityId:
              existingBooking.id,
            description:
              "Dati della prenotazione modificati manualmente.",
            metadata: {
              source: "MANUAL",
              previous: {
                guestId:
                  existingBooking.guestId,
                guestName:
                  existingBooking.guestName,
                guestEmail:
                  existingBooking.guestEmail,
                guestPhone:
                  existingBooking.guestPhone,
                guests:
                  existingBooking.guests,
                roomsBooked:
                  existingBooking.roomsBooked,
                grossAmount:
                  existingBooking.grossAmount,
                currency:
                  existingBooking.currency,
              },
              current: {
                guestId:
                  updatedBooking.guestId,
                guestName:
                  updatedBooking.guestName,
                guestEmail:
                  updatedBooking.guestEmail,
                guestPhone:
                  updatedBooking.guestPhone,
                guests:
                  updatedBooking.guests,
                roomsBooked:
                  updatedBooking.roomsBooked,
                grossAmount:
                  updatedBooking.grossAmount,
                currency:
                  updatedBooking.currency,
              },
            },
          },
          transaction,
        );

        const fingerprint =
          createBookingUpdateFingerprint({
            integrationConnectionId:
              existingBooking.integrationConnectionId,
            propertyId: existingBooking.propertyId,
            ownerId: existingBooking.ownerId,
            guestName: updatedBooking.guestName,
            guestEmail: updatedBooking.guestEmail,
            guestPhone: updatedBooking.guestPhone,
            checkIn: existingBooking.checkIn,
            checkOut: existingBooking.checkOut,
            nights: existingBooking.nights,
            guests: updatedBooking.guests,
            roomsBooked: updatedBooking.roomsBooked,
            grossAmount: Number(updatedBooking.grossAmount),
            currency: updatedBooking.currency,
            bookingStatus: existingBooking.bookingStatus,
          });

        await emitEvent(
          {
            eventType: "BOOKING_UPDATED",
            aggregateType: "BOOKING",
            aggregateId: existingBooking.id,
            payload: {
              bookingId: existingBooking.id,
              propertyId: existingBooking.propertyId,
              ownerId: existingBooking.ownerId,
              guestName: updatedBooking.guestName,
              checkIn: existingBooking.checkIn.toISOString(),
              checkOut: existingBooking.checkOut.toISOString(),
              channel: existingBooking.channel,
            },
            idempotencyKey:
              `BOOKING_UPDATED:${existingBooking.id}:${fingerprint}`,
          },
          transaction,
        );
      }
    },
  );

  redirect(`/bookings/${existingBooking.id}`);
}
export async function setBookingOperationalStatus(
  bookingId: string,
  operationalStatus:
    | "OK"
    | "DOCUMENTS_PENDING"
    | "CLEANING_PENDING",
): Promise<void> {
  const user = await requireUser();
  if (user.role === "OWNER") throw new Error("Operazione non autorizzata.");

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
