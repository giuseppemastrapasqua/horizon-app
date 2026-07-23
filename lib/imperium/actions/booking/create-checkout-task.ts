import { TaskStatus, TaskType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ImperiumAction } from "../types";
import { createTaskDate } from "../../shared";

type BookingCreatedPayload = {
  bookingId?: string;
  propertyId?: string;
  ownerId?: string;
  guestName?: string;
  checkOut?: string;
};

const ACTION_ID = "booking.create-checkout-task";
const ACTION_NAME = "Create checkout task";

export const createCheckoutTaskAction: ImperiumAction = {
  id: ACTION_ID,
  name: ACTION_NAME,
  description:
    "Crea il task di controllo check-out per una nuova prenotazione.",

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

    const title = `Controllo check-out · ${
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
          reason: "Task check-out già presente.",
        },
      };
    }

    const checkOut = payload.checkOut
      ? new Date(payload.checkOut)
      : null;

    const dueDate = checkOut
      ? createTaskDate(checkOut, 0, 10)
      : null;

    const task = await prisma.task.create({
      data: {
        title,
        description:
          "Verificare l'uscita dell'ospite e preparare il controllo post soggiorno.",
        type: TaskType.CHECK_OUT,
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
