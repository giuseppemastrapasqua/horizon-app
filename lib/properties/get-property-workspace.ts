import {
  BookingOperationalStatus,
  BookingStatus,
  TaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getPropertyWorkspace(propertyId: string) {
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

  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
    include: {
      owner: true,

      bookings: {
        orderBy: {
          checkIn: "desc",
        },
      },

      tasks: {
        orderBy: {
          updatedAt: "desc",
        },
      },

      documents: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 6,
      },
    },
  });

  if (!property) {
    return null;
  }

  const totalRevenue = property.bookings.reduce(
    (sum, booking) => sum + Number(booking.grossAmount),
    0
  );

  const currentMonthBookings = property.bookings.filter(
    (booking) =>
      booking.checkIn >= monthStart &&
      booking.checkIn < monthEnd
  );

  const currentMonthRevenue = currentMonthBookings.reduce(
    (sum, booking) => sum + Number(booking.grossAmount),
    0
  );

  const futureBookings = property.bookings.filter(
    (booking) => booking.checkIn > now
  );

  const currentBookings = property.bookings.filter(
    (booking) =>
      booking.checkIn <= now &&
      booking.checkOut > now &&
      booking.bookingStatus !== BookingStatus.CANCELLED
  );

  const openTasks = property.tasks.filter(
    (task) =>
      task.status !== TaskStatus.DONE &&
      task.status !== TaskStatus.CANCELLED
  );

  const completedTasks = property.tasks.filter(
    (task) => task.status === TaskStatus.DONE
  );

  const operationalAlerts = property.bookings.filter(
    (booking) =>
      booking.operationalStatus !== BookingOperationalStatus.OK
  );

  const soldNights = currentMonthBookings.reduce(
    (sum, booking) => sum + booking.nights,
    0
  );

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();

  const occupancyRate =
    daysInMonth > 0
      ? Math.min((soldNights / daysInMonth) * 100, 100)
      : 0;

  const averageBookingValue =
    property.bookings.length > 0
      ? totalRevenue / property.bookings.length
      : 0;

  const totalBookedNights = property.bookings.reduce(
    (sum, booking) => sum + booking.nights,
    0
  );

  const averageNightlyRate =
    totalBookedNights > 0
      ? totalRevenue / totalBookedNights
      : 0;

  const recentBookings = property.bookings
    .slice(0, 8)
    .map((booking) => ({
      id: booking.id,
      guestName: booking.guestName,
      channel: booking.channel,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.nights,
      guests: booking.guests,
      grossAmount: Number(booking.grossAmount),
      bookingStatus: booking.bookingStatus,
      operationalStatus: booking.operationalStatus,
    }));

  const documents = property.documents.map((document) => ({
    id: document.id,
    title: document.title,
    subtitle: document.subtitle,
    type: document.type,
    status: document.status,
    documentNumber: document.documentNumber,
    currentVersion: document.currentVersion,
    referenceMonth: document.referenceMonth,
    updatedAt: document.updatedAt,
  }));

  const timeline = buildPropertyTimeline({
    bookings: property.bookings.slice(0, 5),
    tasks: property.tasks.slice(0, 5),
    documents: property.documents.slice(0, 5),
  });

  return {
    property: {
      id: property.id,
      name: property.name,
      address: property.address,
      city: property.city,
      zone: property.zone,
      description: property.description,
      cleaningCost: property.cleaningCost,
      status: property.status,
      commercialClass: property.commercialClass,
      victoryModel: property.victoryModel,
      currentScore: property.currentScore,
      initialScore: property.initialScore,
      maxGuests: property.maxGuests,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      createdAt: property.createdAt,
      owner: {
        id: property.owner.id,
        fullName: property.owner.fullName,
        email: property.owner.email,
        phone: property.owner.phone,
      },
    },

    metrics: {
      totalRevenue,
      currentMonthRevenue,
      bookingsCount: property.bookings.length,
      futureBookingsCount: futureBookings.length,
      currentBookingsCount: currentBookings.length,
      openTasksCount: openTasks.length,
      completedTasksCount: completedTasks.length,
      operationalAlertsCount: operationalAlerts.length,
      occupancyRate,
      averageBookingValue,
      averageNightlyRate,
      documentsCount: property.documents.length,
      soldNights,
    },

    recentBookings,
    documents,
    timeline,
  };
}

type TimelineInput = {
  bookings: Array<{
    id: string;
    guestName: string;
    createdAt: Date;
    operationalStatus: string;
  }>;

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

function buildPropertyTimeline({
  bookings,
  tasks,
  documents,
}: TimelineInput) {
  const bookingItems = bookings.map((booking) => ({
    id: `booking-${booking.id}`,
    title: `Prenotazione ${booking.guestName}`,
    description: `Stato operativo: ${booking.operationalStatus}`,
    occurredAt: booking.createdAt,
    category: "BOOKING" as const,
    href: `/bookings/${booking.id}`,
    status:
      booking.operationalStatus === "OK"
        ? ("SUCCESS" as const)
        : ("WARNING" as const),
  }));

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
    .slice(0, 10);
}