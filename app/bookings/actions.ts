"use server";

import {
  BookingChannel,
  BookingOperationalStatus,
  BookingStatus,
  
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { emitEvent } from "@/lib/events/emit";
import { processPendingEvents } from "@/lib/events/process-pending";

export async function createBooking(formData: FormData) {
  const propertyId = String(formData.get("propertyId") || "");
  const guestName = String(formData.get("guestName") || "").trim();

  if (!propertyId) {
    throw new Error("Seleziona un immobile.");
  }

  if (!guestName) {
    throw new Error("Inserisci il nome dell'ospite.");
  }

  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
  });

  if (!property) {
    throw new Error("Immobile non trovato.");
  }

  const checkIn = new Date(String(formData.get("checkIn") || ""));
  const checkOut = new Date(String(formData.get("checkOut") || ""));

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    throw new Error("Le date della prenotazione non sono valide.");
  }

  if (checkOut <= checkIn) {
    throw new Error("Il check-out deve essere successivo al check-in.");
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / millisecondsPerDay
  );

  const booking = await prisma.booking.create({
    data: {
      propertyId: property.id,
      ownerId: property.ownerId,
      channel: parseBookingChannel(formData.get("channel")),
      guestName,
      guestEmail: optionalText(formData.get("guestEmail")),
      guestPhone: optionalText(formData.get("guestPhone")),
      checkIn,
      checkOut,
      nights,
      guests: Math.max(1, Number(formData.get("guests") || 1)),
      grossAmount: Math.max(0, Number(formData.get("grossAmount") || 0)),
      currency: "EUR",
      bookingStatus: BookingStatus.CONFIRMED,
      operationalStatus: BookingOperationalStatus.OK,
      internalNotes: optionalText(formData.get("internalNotes")),
    },
  });

   
  await emitEvent({
  eventType: "BOOKING_CREATED",
  aggregateType: "BOOKING",
  aggregateId: booking.id,
  payload: {
    bookingId: booking.id,
    propertyId: booking.propertyId,
    ownerId: booking.ownerId,
    guestName: booking.guestName,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    channel: booking.channel,
  },
  idempotencyKey: `BOOKING_CREATED:${booking.id}`,
});

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
    | "CLEANING_PENDING"
) {
  const booking = await prisma.booking.update({
    where: {
      id: bookingId,
    },
    data: {
      operationalStatus,
    },
    select: {
      id: true,
    },
  });

  redirect(`/bookings/${booking.id}`);
}

function parseBookingChannel(value: FormDataEntryValue | null): BookingChannel {
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

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();

  return text || null;
}

function createTaskDate(baseDate: Date, dayOffset: number, hour: number) {
  const date = new Date(baseDate);

  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(hour, 0, 0, 0);

  return date;
}