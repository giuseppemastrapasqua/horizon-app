import { prisma } from "@/lib/prisma";

export async function getGuestWorkspace(guestId: string) {
  const guest = await prisma.guest.findUnique({
    where: {
      id: guestId,
    },
    include: {
      bookings: {
        orderBy: {
          checkIn: "desc",
        },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              city: true,
              zone: true,
            },
          },
          tasks: {
            orderBy: {
              dueDate: "asc",
            },
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              status: true,
              dueDate: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!guest) {
    return null;
  }

  const totalRevenue = guest.bookings.reduce(
    (sum, booking) => sum + Number(booking.grossAmount),
    0
  );

  const totalNights = guest.bookings.reduce(
    (sum, booking) => sum + booking.nights,
    0
  );

  const allTasks = guest.bookings.flatMap((booking) =>
    booking.tasks.map((task) => ({
      ...task,
      bookingId: booking.id,
      guestName: booking.guestName,
      property: booking.property,
    }))
  );

  const openTasks = allTasks.filter(
    (task) =>
      task.status !== "DONE" &&
      task.status !== "CANCELLED"
  );

  const completedTasks = allTasks.filter(
    (task) => task.status === "DONE"
  );

  const latestBooking = guest.bookings[0] ?? null;

  const propertiesVisited = Array.from(
    new Map(
      guest.bookings.map((booking) => [
        booking.property.id,
        booking.property,
      ])
    ).values()
  );

  const timeline = [
    {
      id: `guest-created-${guest.id}`,
      title: "Profilo ospite creato",
      description: guest.fullName,
      occurredAt: guest.createdAt,
      category: "GUEST",
      status: "SUCCESS" as const,
    },
    ...guest.bookings.map((booking) => ({
      id: `booking-${booking.id}`,
      title: `Soggiorno presso ${booking.property.name}`,
      description: `${booking.bookingStatus} · ${booking.channel}`,
      occurredAt: booking.checkIn,
      category: "BOOKING",
      status:
        booking.bookingStatus === "CONFIRMED"
          ? ("SUCCESS" as const)
          : ("INFO" as const),
      href: `/bookings/${booking.id}`,
    })),
    ...allTasks.map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      description: `Task · ${task.status}`,
      occurredAt: task.updatedAt,
      category: "TASK",
      status:
        task.status === "DONE"
          ? ("SUCCESS" as const)
          : ("INFO" as const),
      href: `/tasks/${task.id}`,
    })),
  ]
    .sort(
      (first, second) =>
        second.occurredAt.getTime() -
        first.occurredAt.getTime()
    )
    .slice(0, 20);

  return {
    guest: {
      id: guest.id,
      fullName: guest.fullName,
      email: guest.email,
      phone: guest.phone,
      notes: guest.notes,
      createdAt: guest.createdAt,
      updatedAt: guest.updatedAt,
    },

    metrics: {
      bookingsCount: guest.bookings.length,
      totalRevenue,
      totalNights,
      propertiesVisitedCount: propertiesVisited.length,
      openTasksCount: openTasks.length,
      completedTasksCount: completedTasks.length,
      latestStayDate: latestBooking?.checkIn ?? null,
    },

    bookings: guest.bookings.map((booking) => ({
      id: booking.id,
      guestName: booking.guestName,
      channel: booking.channel,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      grossAmount: Number(booking.grossAmount),
      currency: booking.currency,
      bookingStatus: booking.bookingStatus,
      operationalStatus: booking.operationalStatus,
      property: booking.property,
    })),

    tasks: allTasks,

    propertiesVisited,
    timeline,
  };
}