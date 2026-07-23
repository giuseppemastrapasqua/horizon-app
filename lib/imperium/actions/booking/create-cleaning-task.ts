import { TaskStatus, TaskType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ImperiumAction } from "../types";
import { createTaskDate } from "../../shared";

type BookingCreatedPayload = {
  bookingId?: string;
  propertyId?: string;
  ownerId?: string;
  guestName?: string;
  checkIn?: string;
};

const ACTION_ID = "booking.create-cleaning-task";
const ACTION_NAME = "Create cleaning task";

export const createCleaningTaskAction: ImperiumAction = {
  id: ACTION_ID,
  name: ACTION_NAME,
  description:
    "Crea il task di pulizia pre check-in per una nuova prenotazione.",

  async execute(context) {
    const payload =
      context.event.payload as BookingCreatedPayload;

    if (!payload.bookingId || !payload.propertyId) {
      return {
        actionId: ACTION_ID,
        actionName: ACTION_NAME,
        success: false,
        error:
          "BOOKING_CREATED senza bookingId o propertyId nel payload.",
      };
    }

    const title = `Pulizia pre check-in · ${
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
        actionId: ACTION_ID,
        actionName: ACTION_NAME,
        success: true,
        skipped: true,
        data: {
          taskId: existingTask.id,
          reason: "Task pulizia già presente.",
        },
      };
    }

    const checkIn = payload.checkIn
      ? new Date(payload.checkIn)
      : null;

    const dueDate = checkIn
      ? createTaskDate(checkIn, -1, 12)
      : null;

    const task = await prisma.task.create({
      data: {
        title,
        description:
          "Coordinare la pulizia, controllare l'appartamento e preparare il welcome kit.",
        type: TaskType.CLEANING,
        status: TaskStatus.TODO,
        dueDate,
        propertyId: payload.propertyId,
        bookingId: payload.bookingId,
        ownerId: payload.ownerId ?? null,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    return {
      actionId: ACTION_ID,
      actionName: ACTION_NAME,
      success: true,
      data: {
        task,
      },
    };
  },
};
