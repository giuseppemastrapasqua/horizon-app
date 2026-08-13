import {
  BookingOperationalStatus,
  BookingStatus,
  TaskStatus,
} from "@prisma/client";

type Booking = {
  grossAmount: unknown;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  bookingStatus: BookingStatus;
  operationalStatus: BookingOperationalStatus;
};

type Task = {
  status: TaskStatus;
};

type Document = {
  id: string;
};

type BuildPropertyMetricsInput = {
  bookings: Booking[];
  tasks: Task[];
  documents: Document[];
  now?: Date;
};

export function buildPropertyMetrics({
  bookings,
  tasks,
  documents,
  now = new Date(),
}: BuildPropertyMetricsInput) {
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

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + Number(booking.grossAmount),
    0,
  );

  const currentMonthBookings = bookings.filter(
    (booking) =>
      booking.checkIn >= monthStart &&
      booking.checkIn < monthEnd,
  );

  const currentMonthRevenue =
    currentMonthBookings.reduce(
      (sum, booking) =>
        sum + Number(booking.grossAmount),
      0,
    );

  const futureBookings = bookings.filter(
    (booking) => booking.checkIn > now,
  );

  const currentBookings = bookings.filter(
    (booking) =>
      booking.checkIn <= now &&
      booking.checkOut > now &&
      booking.bookingStatus !==
        BookingStatus.CANCELLED,
  );

  const openTasks = tasks.filter(
    (task) =>
      task.status !== TaskStatus.DONE &&
      task.status !== TaskStatus.CANCELLED,
  );

  const completedTasks = tasks.filter(
    (task) => task.status === TaskStatus.DONE,
  );

  const operationalAlerts = bookings.filter(
    (booking) =>
      booking.operationalStatus !==
      BookingOperationalStatus.OK,
  );

  const soldNights = currentMonthBookings.reduce(
    (sum, booking) => sum + booking.nights,
    0,
  );

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  const occupancyRate =
    daysInMonth > 0
      ? Math.min((soldNights / daysInMonth) * 100, 100)
      : 0;

  const averageBookingValue =
    bookings.length > 0
      ? totalRevenue / bookings.length
      : 0;

  const totalBookedNights = bookings.reduce(
    (sum, booking) => sum + booking.nights,
    0,
  );

  const averageNightlyRate =
    totalBookedNights > 0
      ? totalRevenue / totalBookedNights
      : 0;

  return {
    totalRevenue,
    currentMonthRevenue,
    bookingsCount: bookings.length,
    futureBookingsCount: futureBookings.length,
    currentBookingsCount: currentBookings.length,
    openTasksCount: openTasks.length,
    completedTasksCount:
      completedTasks.length,
    operationalAlertsCount:
      operationalAlerts.length,
    occupancyRate,
    averageBookingValue,
    averageNightlyRate,
    documentsCount: documents.length,
    soldNights,
  };
}