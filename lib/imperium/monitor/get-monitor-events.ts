import { prisma } from "@/lib/prisma";

export async function getImperiumMonitorEvents() {
  const events = await prisma.systemEvent.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 100,
    select: {
      id: true,
      eventType: true,
      aggregateType: true,
      aggregateId: true,
      status: true,
      attempts: true,
      lastError: true,
      createdAt: true,
      processedAt: true,
      payload: true,
    },
  });

  const bookingIds = events
    .filter(
      (event) =>
        event.aggregateType === "BOOKING" &&
        Boolean(event.aggregateId)
    )
    .map((event) => event.aggregateId as string);

  const bookings = await prisma.booking.findMany({
    where: {
      id: {
        in: bookingIds,
      },
    },
    select: {
      id: true,
      guestName: true,
      guestEmail: true,
      guestPhone: true,
      channel: true,
      checkIn: true,
      checkOut: true,
      property: {
        select: {
          id: true,
          name: true,
        },
      },
      owner: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
  });

  const bookingById = new Map(
    bookings.map((booking) => [booking.id, booking])
  );

  const enrichedEvents = events.map((event) => {
    const booking =
      event.aggregateType === "BOOKING" &&
      event.aggregateId
        ? bookingById.get(event.aggregateId)
        : undefined;

    return {
      ...event,
      booking: booking
        ? {
            id: booking.id,
            guestName: booking.guestName,
            guestEmail: booking.guestEmail,
            guestPhone: booking.guestPhone,
            channel: booking.channel,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            property: booking.property,
            owner: booking.owner,
          }
        : null,
    };
  });

  const totals = enrichedEvents.reduce(
    (accumulator, event) => {
      accumulator.total += 1;

      if (event.status === "COMPLETED") {
        accumulator.completed += 1;
      } else if (event.status === "FAILED") {
        accumulator.failed += 1;
      } else {
        accumulator.pending += 1;
      }

      return accumulator;
    },
    {
      total: 0,
      completed: 0,
      failed: 0,
      pending: 0,
    }
  );

  return {
    events: enrichedEvents,
    totals,
  };
}