import { TaskStatus, TaskType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ImperiumAction } from "../types";

type BookingCreatedPayload = {
  bookingId?: string;
  propertyId?: string;
  ownerId?: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
};

export const createOperationalTaskAction: ImperiumAction = {
  id: "booking.create-operational-task",
  name: "Create operational booking task",
  description:
    "Crea un task operativo di controllo quando viene registrata una prenotazione.",

  async execute(context) {
    const payload =
      context.event.payload as BookingCreatedPayload;

    if (!payload.bookingId) {
      return {
        actionId: "booking.create-operational-task",
        actionName: "Create operational booking task",
        success: false,
        error: "BOOKING_CREATED senza bookingId nel payload.",
      };
    }

    if (!payload.propertyId) {
      return {
        actionId: "booking.create-operational-task",
        actionName: "Create operational booking task",
        success: false,
        error: "BOOKING_CREATED senza propertyId nel payload.",
      };
    }

    const title = `IMPERIUM · Verifica prenotazione ${
      payload.guestName ?? payload.bookingId
    }`;

    const existingTask = await prisma.task.findFirst({
      where: {
        bookingId: payload.bookingId,
        title,
      },
      select: {
        id: true,
      },
    });

    if (existingTask) {
      return {
        actionId: "booking.create-operational-task",
        actionName: "Create operational booking task",
        success: true,
        skipped: true,
        data: {
          taskId: existingTask.id,
          reason: "Task già presente.",
        },
      };
    }

    const task = await prisma.task.create({
      data: {
        title,
        description:
          "Controllo automatico generato da IMPERIUM dopo la creazione della prenotazione.",
        type: TaskType.ADMIN,
        status: TaskStatus.TODO,
        propertyId: payload.propertyId,
        bookingId: payload.bookingId,
        ownerId: payload.ownerId ?? null,
        dueDate: payload.checkIn
          ? new Date(payload.checkIn)
          : null,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    return {
      actionId: "booking.create-operational-task",
      actionName: "Create operational booking task",
      success: true,
      data: {
        task,
      },
    };
  },
};