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

const ACTION_ID = "booking.create-documents-task";
const ACTION_NAME = "Create guest documents task";

export const createDocumentsTaskAction: ImperiumAction = {
  id: ACTION_ID,
  name: ACTION_NAME,
  description:
    "Crea il task di controllo documenti per una nuova prenotazione.",

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

    const title = `Controllo documenti · ${
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
          reason: "Task documenti già presente.",
        },
      };
    }

    const checkIn = payload.checkIn
      ? new Date(payload.checkIn)
      : null;

    const dueDate = checkIn
      ? createTaskDate(checkIn, -2, 18)
      : null;

    const task = await prisma.task.create({
      data: {
        title,
        description:
          "Verificare che i documenti degli ospiti siano completi prima dell'arrivo.",
        type: TaskType.GUEST_DOCUMENTS,
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
