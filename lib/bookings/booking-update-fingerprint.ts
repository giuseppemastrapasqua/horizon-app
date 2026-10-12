import { createHash } from "node:crypto";

import type { BookingStatus } from "@prisma/client";

export type BookingUpdateFingerprintInput = {
  integrationConnectionId: string | null;
  propertyId: string;
  ownerId: string;
  guestName: string;
  guestEmail: string | null;
  guestPhone: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  roomsBooked: number | null;
  grossAmount: number;
  currency: string;
  bookingStatus: BookingStatus;
};

export function createBookingUpdateFingerprint(
  input: BookingUpdateFingerprintInput,
): string {
  const serializedState = JSON.stringify({
    integrationConnectionId:
      input.integrationConnectionId,
    propertyId: input.propertyId,
    ownerId: input.ownerId,
    guestName: input.guestName,
    guestEmail: input.guestEmail,
    guestPhone: input.guestPhone,
    checkIn: input.checkIn.toISOString(),
    checkOut: input.checkOut.toISOString(),
    nights: input.nights,
    guests: input.guests,
    roomsBooked: input.roomsBooked,
    grossAmount: input.grossAmount,
    currency: input.currency,
    bookingStatus: input.bookingStatus,
  });

  return createHash("sha256")
    .update(serializedState)
    .digest("hex");
}
