import {
  getFutureBookings,
  getNextCheckIns,
  getNextCheckOuts,
  getOperationalAlerts,
} from "@/lib/dashboard/bookings";
import { getCommandCenter } from "@/lib/dashboard/get-command-center";
import {
  getActiveProperties,
  getAverageBookingRevenue,
  getTotalRevenue,
} from "@/lib/dashboard/metrics";
import {
  getCompletedTasks,
  getOpenTasks,
  getUrgentTasks,
} from "@/lib/dashboard/tasks";
import { prisma } from "@/lib/prisma";

export async function getDashboardPageData() {
  const [
    properties,
    bookings,
    tasks,
    commandCenter,
  ] = await Promise.all([
    prisma.property.findMany({
      include: {
        owner: true,
        bookings: true,
        tasks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.booking.findMany({
      include: {
        property: true,
        owner: true,
      },
      orderBy: {
        checkIn: "asc",
      },
    }),

    prisma.task.findMany({
      include: {
        property: true,
        booking: true,
      },
      orderBy: [
        {
          status: "asc",
        },
        {
          dueDate: "asc",
        },
      ],
    }),

    getCommandCenter(),
  ]);

  const now = new Date();

  const totalRevenue = getTotalRevenue(bookings);

  const activeProperties =
    getActiveProperties(properties);

  const openTasks = getOpenTasks(tasks);

  const completedTasks =
    getCompletedTasks(tasks);

  const futureBookings = getFutureBookings(
    bookings,
    now
  );

  const operationalAlerts =
    getOperationalAlerts(bookings);

  const averageBookingRevenue =
    getAverageBookingRevenue(
      totalRevenue,
      bookings.length
    );

  const urgentTasks = getUrgentTasks(
    openTasks
  );

  const nextCheckIns =
    getNextCheckIns(futureBookings);

  const nextCheckOuts =
    getNextCheckOuts(futureBookings);

  return {
    properties,
    bookings,
    tasks,
    commandCenter,
    totalRevenue,
    activeProperties,
    openTasks,
    completedTasks,
    futureBookings,
    operationalAlerts,
    averageBookingRevenue,
    urgentTasks,
    nextCheckIns,
    nextCheckOuts,
  };
}

export type DashboardPageData = Awaited<
  ReturnType<typeof getDashboardPageData>
>;