import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getBookingWorkspace(bookingId: string) {
  const now = new Date();

  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    include: {
      property: {
        include: {
          owner: true,
        },
      },
      tasks: {
        orderBy: {
          dueDate: "asc",
        },
      },
    },
  });

  if (!booking) {
    return null;
  }

  const documents = await prisma.document.findMany({
    where: {
      OR: [
        {
          propertyId: booking.propertyId,
        },
        {
          ownerId: booking.ownerId,
        },
      ],
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 6,
  });

  const totalTaskCount = booking.tasks.length;

  const openTasks = booking.tasks.filter(
    (task) =>
      task.status !== TaskStatus.DONE &&
      task.status !== TaskStatus.CANCELLED
  );

  const completedTasks = booking.tasks.filter(
    (task) => task.status === TaskStatus.DONE
  );

  const overdueTasks = openTasks.filter(
    (task) => task.dueDate && task.dueDate < now
  );

  const stayProgress = calculateStayProgress({
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    now,
  });

  const nightlyRate =
    booking.nights > 0
      ? Number(booking.grossAmount) / booking.nights
      : 0;

  const timeline = buildBookingTimeline({
    booking: {
      id: booking.id,
      guestName: booking.guestName,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      bookingStatus: booking.bookingStatus,
      operationalStatus: booking.operationalStatus,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
    },
    tasks: booking.tasks,
    documents,
  });

  return {
    booking: {
      id: booking.id,
      guestId: booking.guestId,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      channel: booking.channel,
      externalBookingId: booking.externalBookingId,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      grossAmount: Number(booking.grossAmount),
      currency: booking.currency,
      bookingStatus: booking.bookingStatus,
      operationalStatus: booking.operationalStatus,
      internalNotes: booking.internalNotes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      property: {
        id: booking.property.id,
        name: booking.property.name,
        address: booking.property.address,
        city: booking.property.city,
        zone: booking.property.zone,
      },
      owner: {
        id: booking.property.owner.id,
        fullName: booking.property.owner.fullName,
        email: booking.property.owner.email,
        phone: booking.property.owner.phone,
      },
    },

    metrics: {
      totalTaskCount,
      openTasksCount: openTasks.length,
      completedTasksCount: completedTasks.length,
      overdueTasksCount: overdueTasks.length,
      documentsCount: documents.length,
      nightlyRate,
      stayProgress,
      daysUntilCheckIn: calculateDaysUntil(
        now,
        booking.checkIn
      ),
      daysUntilCheckOut: calculateDaysUntil(
        now,
        booking.checkOut
      ),
    },

    tasks: booking.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      dueDate: task.dueDate,
      updatedAt: task.updatedAt,
    })),

    documents: documents.map((document) => ({
      id: document.id,
      title: document.title,
      subtitle: document.subtitle,
      type: document.type,
      status: document.status,
      documentNumber: document.documentNumber,
      currentVersion: document.currentVersion,
      referenceMonth: document.referenceMonth,
      updatedAt: document.updatedAt,
    })),

    timeline,
  };
}

function calculateStayProgress({
  checkIn,
  checkOut,
  now,
}: {
  checkIn: Date;
  checkOut: Date;
  now: Date;
}) {
  if (now <= checkIn) {
    return 0;
  }

  if (now >= checkOut) {
    return 100;
  }

  const total = checkOut.getTime() - checkIn.getTime();
  const elapsed = now.getTime() - checkIn.getTime();

  return Math.min(
    100,
    Math.max(0, (elapsed / total) * 100)
  );
}

function calculateDaysUntil(
  from: Date,
  to: Date
) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.ceil(
    (to.getTime() - from.getTime()) /
      millisecondsPerDay
  );
}

type TimelineInput = {
  booking: {
    id: string;
    guestName: string;
    createdAt: Date;
    updatedAt: Date;
    bookingStatus: string;
    operationalStatus: string;
    checkIn: Date;
    checkOut: Date;
  };
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: Date;
  }>;
  documents: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: Date;
  }>;
};

function buildBookingTimeline({
  booking,
  tasks,
  documents,
}: TimelineInput) {
  const bookingItems = [
    {
      id: `booking-created-${booking.id}`,
      title: `Prenotazione creata per ${booking.guestName}`,
      description: `Stato: ${booking.bookingStatus}`,
      occurredAt: booking.createdAt,
      category: "BOOKING" as const,
      status: "SUCCESS" as const,
    },
    {
      id: `booking-updated-${booking.id}`,
      title: "Prenotazione aggiornata",
      description: `Stato operativo: ${booking.operationalStatus}`,
      occurredAt: booking.updatedAt,
      category: "SYSTEM" as const,
      status:
        booking.operationalStatus === "OK"
          ? ("SUCCESS" as const)
          : ("WARNING" as const),
    },
    {
      id: `booking-checkin-${booking.id}`,
      title: "Check-in",
      description: booking.checkIn.toLocaleString("it-IT"),
      occurredAt: booking.checkIn,
      category: "BOOKING" as const,
      status: "INFO" as const,
    },
    {
      id: `booking-checkout-${booking.id}`,
      title: "Check-out",
      description: booking.checkOut.toLocaleString("it-IT"),
      occurredAt: booking.checkOut,
      category: "BOOKING" as const,
      status: "INFO" as const,
    },
  ];

  const taskItems = tasks.map((task) => ({
    id: `task-${task.id}`,
    title: task.title,
    description: `Task · ${task.status}`,
    occurredAt: task.updatedAt,
    category: "TASK" as const,
    href: `/tasks/${task.id}`,
    status:
      task.status === "DONE"
        ? ("SUCCESS" as const)
        : task.status === "IN_PROGRESS"
          ? ("WARNING" as const)
          : ("INFO" as const),
  }));

  const documentItems = documents.map((document) => ({
    id: `document-${document.id}`,
    title: document.title,
    description: `Documento · ${document.status}`,
    occurredAt: document.updatedAt,
    category: "DOCUMENT" as const,
    href: `/documents/${document.id}`,
    status:
      document.status === "FINAL" ||
      document.status === "ISSUED"
        ? ("SUCCESS" as const)
        : ("INFO" as const),
  }));

  return [
    ...bookingItems,
    ...taskItems,
    ...documentItems,
  ]
    .sort(
      (first, second) =>
        second.occurredAt.getTime() -
        first.occurredAt.getTime()
    )
    .slice(0, 12);
}