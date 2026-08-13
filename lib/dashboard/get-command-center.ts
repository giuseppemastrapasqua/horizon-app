import {
  BackgroundJobStatus,
  TaskStatus,
} from "@prisma/client";

import {
  getTodayCheckIns,
  getTodayCheckOuts,
} from "@/lib/dashboard/command-center-bookings";
import { getPriorityTasks } from "@/lib/dashboard/command-center-task";
import { prisma } from "@/lib/prisma";

export async function getCommandCenter() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [
    checkInsToday,
    checkOutsToday,
    openTasks,
    overdueTasks,
    pendingEvents,
    failedEvents,
    queuedBackgroundJobs,
    runningBackgroundJobs,
    completedBackgroundJobs,
    failedBackgroundJobs,
  ] = await Promise.all([
    prisma.booking.findMany({
      where: {
        checkIn: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: {
        checkIn: "asc",
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.booking.findMany({
      where: {
        checkOut: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: {
        checkOut: "asc",
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.task.findMany({
      where: {
        status: {
          notIn: [
            TaskStatus.DONE,
            TaskStatus.CANCELLED,
          ],
        },
      },
      orderBy: [
        {
          dueDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 12,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        booking: {
          select: {
            id: true,
            guestName: true,
          },
        },
      },
    }),

    prisma.task.count({
      where: {
        status: {
          notIn: [
            TaskStatus.DONE,
            TaskStatus.CANCELLED,
          ],
        },
        dueDate: {
          lt: now,
        },
      },
    }),

    prisma.systemEvent.count({
      where: {
        status: {
          in: ["PENDING", "PROCESSING"],
        },
      },
    }),

    prisma.systemEvent.count({
      where: {
        status: "FAILED",
      },
    }),

    prisma.backgroundJob.count({
      where: {
        status: BackgroundJobStatus.QUEUED,
      },
    }),

    prisma.backgroundJob.count({
      where: {
        status: BackgroundJobStatus.RUNNING,
      },
    }),

    prisma.backgroundJob.count({
      where: {
        status: BackgroundJobStatus.COMPLETED,
      },
    }),

    prisma.backgroundJob.count({
      where: {
        status: BackgroundJobStatus.FAILED,
      },
    }),
  ]);

  const priorityTasks = getPriorityTasks(
    openTasks,
    now
  );

  const todayCheckIns =
    getTodayCheckIns(checkInsToday);

  const todayCheckOuts =
    getTodayCheckOuts(checkOutsToday);

  return {
    generatedAt: now,

    metrics: {
      checkInsToday: todayCheckIns.length,
      checkOutsToday: todayCheckOuts.length,
      openTasks: openTasks.length,
      overdueTasks,
      pendingEvents,
      failedEvents,
      queuedBackgroundJobs,
      runningBackgroundJobs,
      completedBackgroundJobs,
      failedBackgroundJobs,
    },

    checkInsToday: todayCheckIns,
    checkOutsToday: todayCheckOuts,
    priorityTasks,
  };
}