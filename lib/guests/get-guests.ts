import { prisma } from "@/lib/prisma";

export async function getGuests() {
  const guests = await prisma.guest.findMany({
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      bookings: {
        orderBy: {
          checkIn: "desc",
        },
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          grossAmount: true,
          currency: true,
          property: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return guests.map((guest) => {
    const totalRevenue = guest.bookings.reduce(
      (sum, booking) => sum + Number(booking.grossAmount),
      0
    );

    const latestBooking = guest.bookings[0] ?? null;

    return {
      id: guest.id,
      fullName: guest.fullName,
      email: guest.email,
      phone: guest.phone,
      notes: guest.notes,
      createdAt: guest.createdAt,
      updatedAt: guest.updatedAt,
      bookingsCount: guest.bookings.length,
      totalRevenue,
      currency: latestBooking?.currency ?? "EUR",
      latestStay: latestBooking
        ? {
            id: latestBooking.id,
            checkIn: latestBooking.checkIn,
            checkOut: latestBooking.checkOut,
            property: latestBooking.property,
          }
        : null,
    };
  });
}