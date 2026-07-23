import {
  BookingOperationalStatus,
  TaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { OwnerTimelineItem } from "@/app/owners/[id]/components/OwnerTimeline";

export async function getOwnerWorkspace(ownerId: string) {
  const now = new Date();

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  const owner = await prisma.user.findUnique({
    where: {
      id: ownerId,
    },
    include: {
      properties: {
        orderBy: {
          name: "asc",
        },
        include: {
          bookings: true,
          tasks: true,
        },
      },

      bookings: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          property: true,
        },
      },

      tasks: {
        orderBy: {
          updatedAt: "desc",
        },
        include: {
          property: true,
          booking: true,
        },
      },

      documents: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 6,
        include: {
          property: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!owner) {
    return null;
  }

  const totalRevenue = owner.bookings.reduce(
    (sum, booking) => sum + Number(booking.grossAmount),
    0
  );

  const currentMonthRevenue = owner.bookings
    .filter(
      (booking) =>
        booking.checkIn >= monthStart &&
        booking.checkIn < monthEnd
    )
    .reduce(
      (sum, booking) => sum + Number(booking.grossAmount),
      0
    );

  const futureBookings = owner.bookings.filter(
    (booking) => booking.checkIn > now
  );

  const currentBookings = owner.bookings.filter(
    (booking) =>
      booking.checkIn <= now &&
      booking.checkOut > now
  );

  const openTasks = owner.tasks.filter(
    (task) =>
      task.status !== TaskStatus.DONE &&
      task.status !== TaskStatus.CANCELLED
  );

  const operationalAlerts = owner.bookings.filter(
    (booking) =>
      booking.operationalStatus !==
      BookingOperationalStatus.OK
  );

  const averageScore =
    owner.properties.length > 0
      ? owner.properties.reduce(
          (sum, property) =>
            sum + property.currentScore,
          0
        ) / owner.properties.length
      : 0;

  const properties = owner.properties.map((property) => {
    const revenue = property.bookings.reduce(
      (sum, booking) =>
        sum + Number(booking.grossAmount),
      0
    );

    const propertyFutureBookings =
      property.bookings.filter(
        (booking) => booking.checkIn > now
      );

    const propertyOpenTasks = property.tasks.filter(
      (task) =>
        task.status !== TaskStatus.DONE &&
        task.status !== TaskStatus.CANCELLED
    );

    return {
      id: property.id,
      name: property.name,
      city: property.city,
      zone: property.zone,
      status: property.status,
      commercialClass: property.commercialClass,
      currentScore: property.currentScore,
      bookingsCount: property.bookings.length,
      futureBookingsCount:
        propertyFutureBookings.length,
      openTasksCount: propertyOpenTasks.length,
      revenue,
    };
  });

  const documents = owner.documents.map((document) => ({
    id: document.id,
    title: document.title,
    subtitle: document.subtitle,
    type: document.type,
    status: document.status,
    documentNumber: document.documentNumber,
    currentVersion: document.currentVersion,
    referenceMonth: document.referenceMonth,
    updatedAt: document.updatedAt,
    propertyName: document.property?.name ?? null,
  }));

  const timeline = buildOwnerTimeline({
    bookings: owner.bookings.slice(0, 5),
    tasks: owner.tasks.slice(0, 5),
    documents: owner.documents.slice(0, 5),
  });

  return {
    owner: {
      id: owner.id,
      fullName: owner.fullName,
      email: owner.email,
      phone: owner.phone,
      status: owner.status,
      createdAt: owner.createdAt,
    },

    metrics: {
      totalRevenue,
      currentMonthRevenue,
      propertiesCount: owner.properties.length,
      futureBookingsCount: futureBookings.length,
      currentBookingsCount: currentBookings.length,
      openTasksCount: openTasks.length,
      operationalAlertsCount:
        operationalAlerts.length,
      documentsCount: owner.documents.length,
      averageScore,
    },

    properties,
    documents,
    timeline,
    firstPropertyId:
      owner.properties[0]?.id ?? null,
  };
}

type TimelineInput = {
  bookings: Array<{
    id: string;
    guestName: string;
    createdAt: Date;
    operationalStatus: string;
    property: {
      name: string;
    };
  }>;

  tasks: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: Date;
    property: {
      name: string;
    };
  }>;

  documents: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: Date;
  }>;
};

function buildOwnerTimeline({
  bookings,
  tasks,
  documents,
}: TimelineInput): OwnerTimelineItem[] {
  const bookingItems: OwnerTimelineItem[] =
    bookings.map((booking) => ({
      id: `booking-${booking.id}`,
      title: `Prenotazione ${booking.guestName}`,
      description: `${booking.property.name} · ${booking.operationalStatus}`,
      occurredAt: booking.createdAt,
      category: "BOOKING",
      href: `/bookings/${booking.id}`,
      status:
        booking.operationalStatus === "OK"
          ? "SUCCESS"
          : "WARNING",
    }));

  const taskItems: OwnerTimelineItem[] = tasks.map(
    (task) => ({
      id: `task-${task.id}`,
      title: task.title,
      description: `${task.property.name} · ${task.status}`,
      occurredAt: task.updatedAt,
      category: "TASK",
      href: `/tasks/${task.id}`,
      status:
        task.status === "DONE"
          ? "SUCCESS"
          : task.status === "IN_PROGRESS"
            ? "WARNING"
            : "INFO",
    })
  );

  const documentItems: OwnerTimelineItem[] =
    documents.map((document) => ({
      id: `document-${document.id}`,
      title: document.title,
      description: `Documento · ${document.status}`,
      occurredAt: document.updatedAt,
      category: "DOCUMENT",
      href: `/documents/${document.id}`,
      status:
        document.status === "FINAL" ||
        document.status === "ISSUED"
          ? "SUCCESS"
          : "INFO",
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
    .slice(0, 10);
}