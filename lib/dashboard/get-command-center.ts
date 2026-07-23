import { TaskStatus } from "@prisma/client";
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
  ]);

  const priorityTasks = openTasks
    .map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: task.status,
      dueDate: task.dueDate,
      property: task.property,
      booking: task.booking,
      isOverdue:
        Boolean(task.dueDate) &&
        task.dueDate! < now,
    }))
    .sort((first, second) => {
      if (first.isOverdue && !second.isOverdue) return -1;
      if (!first.isOverdue && second.isOverdue) return 1;

      const firstDue =
        first.dueDate?.getTime() ??
        Number.MAX_SAFE_INTEGER;

      const secondDue =
        second.dueDate?.getTime() ??
        Number.MAX_SAFE_INTEGER;

      return firstDue - secondDue;
    });

  return {
    generatedAt: now,

    metrics: {
      checkInsToday: checkInsToday.length,
      checkOutsToday: checkOutsToday.length,
      openTasks: openTasks.length,
      overdueTasks,
      pendingEvents,
      failedEvents,
    },

    checkInsToday: checkInsToday.map((booking) => ({
      id: booking.id,
      guestName: booking.guestName,
      checkIn: booking.checkIn,
      operationalStatus: booking.operationalStatus,
      channel: booking.channel,
      property: booking.property,
    })),

    checkOutsToday: checkOutsToday.map((booking) => ({
      id: booking.id,
      guestName: booking.guestName,
      checkOut: booking.checkOut,
      operationalStatus: booking.operationalStatus,
      channel: booking.channel,
      property: booking.property,
    })),

    priorityTasks,
  };
}