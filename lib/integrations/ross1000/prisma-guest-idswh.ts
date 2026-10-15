import { prisma } from "@/lib/prisma";

import { buildRoss1000GuestIdswh } from "./guest-idswh";

export async function ensureRoss1000GuestIdswh(
  bookingGuestId: string,
): Promise<string> {
  const guest = await prisma.bookingGuest.findUnique({
    where: { id: bookingGuestId },
    select: {
      id: true,
      ross1000Idswh: true,
    },
  });

  if (!guest) {
    throw new Error(
      `ROSS1000: ospite non trovato: ${bookingGuestId}.`,
    );
  }

  if (guest.ross1000Idswh) {
    return guest.ross1000Idswh;
  }

  const candidate = buildRoss1000GuestIdswh(guest.id);

  await prisma.bookingGuest.updateMany({
    where: {
      id: guest.id,
      ross1000Idswh: null,
    },
    data: {
      ross1000Idswh: candidate,
    },
  });

  const persisted = await prisma.bookingGuest.findUnique({
    where: { id: guest.id },
    select: { ross1000Idswh: true },
  });

  if (!persisted?.ross1000Idswh) {
    throw new Error(
      `ROSS1000: impossibile assegnare idswh all'ospite ${guest.id}.`,
    );
  }

  return persisted.ross1000Idswh;
}
