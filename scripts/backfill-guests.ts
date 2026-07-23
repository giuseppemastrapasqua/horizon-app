import { prisma } from "@/lib/prisma";
import { findOrCreateGuest } from "@/lib/guests";

async function main() {
  const bookings = await prisma.booking.findMany({
    where: {
      guestId: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(`Trovate ${bookings.length} prenotazioni da collegare.`);

  let linked = 0;
  let created = 0;

  for (const booking of bookings) {
    const result = await findOrCreateGuest({
      fullName: booking.guestName,
      email: booking.guestEmail,
      phone: booking.guestPhone,
    });

    if (result.created) {
      created++;
    }

    await prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        guestId: result.guest.id,
      },
    });

    linked++;
  }

  console.log("");

  console.log("Backfill completato");

  console.table({
    bookings: bookings.length,
    guestsCreated: created,
    bookingsLinked: linked,
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });