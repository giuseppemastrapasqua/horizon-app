import {
  BookingOperationalStatus,
  TaskStatus,
} from "@prisma/client";

import type { OwnerTimelineItem } from "@/app/owners/[id]/components/OwnerTimeline";
import { getAccessiblePropertyIds } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export async function getOwnerWorkspace(ownerId: string) {
  const accessiblePropertyIds = await getAccessiblePropertyIds();
  const now = new Date();

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  );

  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
  );

  const owner = await prisma.user.findFirst({
    where: {
      id: ownerId,
      role: "OWNER",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
    },
  });

  if (!owner) {
    return null;
  }

  const propertyWhere =
    accessiblePropertyIds === null
      ? {
          OR: [
            { ownerId },
            {
              accesses: {
                some: {
                  userId: ownerId,
                  active: true,
                  role: "OWNER" as const,
                },
              },
            },
          ],
        }
      : {
          id: {
            in: accessiblePropertyIds,
          },
        };

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    orderBy: {
      name: "asc",
    },
    include: {
      bookings: true,
      tasks: true,
    },
  });

  const propertyIds = properties.map((property) => property.id);

  const [bookings, tasks, documents] = await Promise.all([
    prisma.booking.findMany({
      where: {
        propertyId: {
          in: propertyIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        property: true,
      },
    }),

    prisma.task.findMany({
      where: {
        propertyId: {
          in: propertyIds,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        property: true,
        booking: true,
      },
    }),

    prisma.document.findMany({
      where: {
        propertyId: {
          in: propertyIds,
        },
      },
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
    }),
  ]);

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + Number(booking.grossAmount),
    0,
  );

  const currentMonthRevenue = bookings
    .filter(
      (booking) =>
        booking.checkIn >= monthStart &&
        booking.checkIn < monthEnd,
    )
    .reduce(
      (sum, booking) => sum + Number(booking.grossAmount),
      0,
    );

  const futureBookings = bookings.filter(
    (booking) => booking.checkIn > now,
  );

  const currentBookings = bookings.filter(
    (booking) =>
      booking.checkIn <= now &&
      booking.checkOut > now,
  );

  const openTasks = tasks.filter(
    (task) =>
      task.status !== TaskStatus.DONE &&
      task.status !== TaskStatus.CANCELLED,
  );

  const operationalAlerts = bookings.filter(
    (booking) =>
      booking.operationalStatus !== BookingOperationalStatus.OK,
  );

  const averageScore =
    properties.length > 0
      ? properties.reduce(
          (sum, property) => sum + property.currentScore,
          0,
        ) / properties.length
      : 0;

  const ownerProperties = properties.map((property) => {
    const revenue = property.bookings.reduce(
      (sum, booking) => sum + Number(booking.grossAmount),
      0,
    );

    const propertyFutureBookings = property.bookings.filter(
      (booking) => booking.checkIn > now,
    );

    const propertyOpenTasks = property.tasks.filter(
      (task) =>
        task.status !== TaskStatus.DONE &&
        task.status !== TaskStatus.CANCELLED,
    );

    const monthlyPerformance = Array.from(
      { length: 6 },
      (_, index) => {
        const monthDate = new Date(
          now.getFullYear(),
          now.getMonth() - (5 - index),
          1,
        );

        const nextMonth = new Date(
          monthDate.getFullYear(),
          monthDate.getMonth() + 1,
          1,
        );

        const monthBookings = property.bookings.filter(
          (booking) =>
            booking.checkIn >= monthDate &&
            booking.checkIn < nextMonth,
        );

        return {
          label: monthDate.toLocaleDateString("it-IT", {
            month: "short",
          }),
          revenue: monthBookings.reduce(
            (sum, booking) =>
              sum + Number(booking.grossAmount),
            0,
          ),
          bookings: monthBookings.length,
        };
      },
    );

    const nextMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    );

    const nextMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 2,
      1,
    );

    const daysInNextMonth = Math.round(
      (nextMonthEnd.getTime() - nextMonthStart.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const activeNextMonthBookings = property.bookings.filter(
      (booking) =>
        booking.bookingStatus !== "CANCELLED" &&
        booking.checkIn < nextMonthEnd &&
        booking.checkOut > nextMonthStart,
    );

    const nextMonthArrivals = activeNextMonthBookings
      .filter(
        (booking) =>
          booking.checkIn >= nextMonthStart &&
          booking.checkIn < nextMonthEnd,
      )
      .sort(
        (first, second) =>
          first.checkIn.getTime() - second.checkIn.getTime(),
      );

    const nextMonthNights = activeNextMonthBookings.reduce(
      (sum, booking) => {
        const occupiedStart =
          booking.checkIn > nextMonthStart
            ? booking.checkIn
            : nextMonthStart;

        const occupiedEnd =
          booking.checkOut < nextMonthEnd
            ? booking.checkOut
            : nextMonthEnd;

        const occupiedMilliseconds = Math.max(
          0,
          occupiedEnd.getTime() - occupiedStart.getTime(),
        );

        return (
          sum +
          Math.round(
            occupiedMilliseconds / (1000 * 60 * 60 * 24),
          )
        );
      },
      0,
    );

    const nextMonthGrossRevenue = nextMonthArrivals.reduce(
      (sum, booking) => sum + Number(booking.grossAmount),
      0,
    );

    const firstBooking = nextMonthArrivals[0] ?? null;

    const nextMonth = {
      label: nextMonthStart.toLocaleDateString("it-IT", {
        month: "long",
        year: "numeric",
      }),
      bookings: nextMonthArrivals.length,
      nights: Math.min(nextMonthNights, daysInNextMonth),
      occupancyRate: Math.min(
        100,
        Math.round(
          (nextMonthNights / daysInNextMonth) * 100,
        ),
      ),
      grossRevenue: nextMonthGrossRevenue,
      firstBooking: firstBooking
        ? {
            id: firstBooking.id,
            checkIn: firstBooking.checkIn,
            nights: firstBooking.nights,
          }
        : null,
    };

    return {
      id: property.id,
      name: property.name,
      city: property.city,
      zone: property.zone,
      status: property.status,
      commercialClass: property.commercialClass,
      currentScore: property.currentScore,
      bookingsCount: property.bookings.length,
      futureBookingsCount: propertyFutureBookings.length,
      openTasksCount: propertyOpenTasks.length,
      revenue,
      monthlyPerformance,
      nextMonth,
    };
  });

  const ownerDocuments = documents.map((document) => ({
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
    bookings: bookings.slice(0, 5),
    tasks: tasks.slice(0, 5),
    documents: documents.slice(0, 5),
  });

  return {
    owner,

    metrics: {
      totalRevenue,
      currentMonthRevenue,
      propertiesCount: properties.length,
      futureBookingsCount: futureBookings.length,
      currentBookingsCount: currentBookings.length,
      openTasksCount: openTasks.length,
      operationalAlertsCount: operationalAlerts.length,
      documentsCount: documents.length,
      averageScore,
    },

    properties: ownerProperties,
    documents: ownerDocuments,
    timeline,
    firstPropertyId: properties[0]?.id ?? null,
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
  const bookingItems: OwnerTimelineItem[] = bookings.map(
    (booking) => ({
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
    }),
  );

  const taskItems: OwnerTimelineItem[] = tasks.map((task) => ({
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
  }));

  const documentItems: OwnerTimelineItem[] = documents.map(
    (document) => ({
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
    }),
  );

  return [
    ...bookingItems,
    ...taskItems,
    ...documentItems,
  ]
    .sort(
      (first, second) =>
        second.occurredAt.getTime() -
        first.occurredAt.getTime(),
    )
    .slice(0, 10);
}
