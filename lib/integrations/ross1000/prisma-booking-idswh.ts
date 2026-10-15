import { prisma } from "@/lib/prisma";

import { buildRoss1000BookingIdswh } from "./booking-idswh";

export async function ensureRoss1000BookingIdswh(
  bookingId: string,
): Promise<string> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      ross1000Idswh: true,
    },
  });

  if (!booking) {
    throw new Error(
      `ROSS1000: prenotazione non trovata: ${bookingId}.`,
    );
  }

  if (booking.ross1000Idswh) {
    return booking.ross1000Idswh;
  }

  const candidate = buildRoss1000BookingIdswh(booking.id);

  await prisma.booking.updateMany({
    where: {
      id: booking.id,
      ross1000Idswh: null,
    },
    data: {
      ross1000Idswh: candidate,
    },
  });

  const persisted = await prisma.booking.findUnique({
    where: { id: booking.id },
    select: { ross1000Idswh: true },
  });

  if (!persisted?.ross1000Idswh) {
    throw new Error(
      `ROSS1000: impossibile assegnare idswh alla prenotazione ${booking.id}.`,
    );
  }

  return persisted.ross1000Idswh;
}
