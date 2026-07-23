import { prisma } from "@/lib/prisma";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { BookingsStudioClient } from "./BookingsStudioClient";

export default async function BookingsStudioPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const serializedBookings = bookings.map((booking) => ({
    id: booking.id,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    property: {
      id: booking.property.id,
      name: booking.property.name,
    },
    channel: booking.channel,
    bookingStatus: booking.bookingStatus,
    operationalStatus: booking.operationalStatus,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    nights: booking.nights,
    guests: booking.guests,
    grossAmount: Number(booking.grossAmount),
    currency: booking.currency,
    createdAt: booking.createdAt.toISOString(),
updatedAt: booking.updatedAt.toISOString(),
  }));

  return (
    <>
      <Navigation />

      <AppShell
        title="Bookings Studio"
        subtitle="Una vista operativa di tutte le prenotazioni."
      >
        <BookingsStudioClient bookings={serializedBookings} />
      </AppShell>
    </>
  );
}