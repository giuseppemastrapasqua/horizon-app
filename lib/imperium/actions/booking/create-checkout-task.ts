import {
  AuditAction,
  TaskStatus,
  TaskType,
} from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { emitEvent } from "@/lib/events/emit";
import { prisma } from "@/lib/prisma";
import { resolveTaskAssignee } from "@/lib/tasks/resolve-task-assignee";
import { AuditService } from "@/services/audit/AuditService";

import { createTaskDate } from "../../shared";
import type { ImperiumAction } from "../types";

type BookingCreatedPayload = {
  bookingId?: string;
  propertyId?: string;
  ownerId?: string;
  guestName?: string;
  checkOut?: string;
};

const ACTION_ID =
  "booking.create-checkout-task";

const ACTION_NAME =
  "Create checkout task";

export const createCheckoutTaskAction: ImperiumAction =
  {
    id: ACTION_ID,
    name: ACTION_NAME,
    description:
      "Crea il task di controllo check-out per una nuova prenotazione.",

    async execute(context) {
      const payload =
        context.event
          .payload as BookingCreatedPayload;

      if (
        !payload.bookingId ||
        !payload.propertyId
      ) {
        return {
          actionId: ACTION_ID,
          actionName: ACTION_NAME,
          success: false,
          error:
            "BOOKING_CREATED senza bookingId o propertyId nel payload.",
        };
      }

      const bookingId = payload.bookingId;
      const propertyId = payload.propertyId;
      const ownerId = payload.ownerId ?? null;

      const title =
        `Controllo check-out · ${
          payload.guestName ??
          bookingId
        }`;

      const checkOut = payload.checkOut
        ? new Date(payload.checkOut)
        : null;

      const dueDate = checkOut
        ? createTaskDate(
            checkOut,
            0,
            10,
          )
        : null;

      const result =
        await prisma.$transaction(
          async (transaction) => {
            const existingTask =
              await transaction.task.findFirst(
                {
                  where: {
                    bookingId,
                    title,
                  },
                  select: {
                    id: true,
                  },
                },
              );

            if (existingTask) {
              return {
                skipped: true as const,
                taskId: existingTask.id,
              };
            }

            const task =
              await transaction.task.create({
                data: {
                  title,
                  description:
                    "Verificare l'uscita dell'ospite e preparare il controllo post soggiorno.",
                  type: TaskType.CHECK_OUT,
                  status: TaskStatus.TODO,
                  dueDate,
                  propertyId,
                  bookingId,
                  ownerId,
                },
                select: {
                  id: true,
                  title: true,
                  description: true,
                  type: true,
                  status: true,
                  dueDate: true,
                  propertyId: true,
                  bookingId: true,
                  ownerId: true,
                },
              });

            await AuditService.log(
              {
                action:
                  AuditAction.CREATE,
                propertyId:
                  task.propertyId,
                entityType:
                  AUDIT_ENTITY_TYPES.TASK,
                entityId: task.id,
                description:
                  "Attività di check-out creata automaticamente dal workflow.",
                metadata: {
                  title: task.title,
                  description:
                    task.description,
                  type: task.type,
                  status: task.status,
                  dueDate:
                    task.dueDate?.toISOString() ??
                    null,
                  bookingId:
                    task.bookingId,
                  ownerId:
                    task.ownerId,
                  creationSource:
                    "WORKFLOW",
                  workflowActionId:
                    ACTION_ID,
                  workflowEventId:
                    context.event.id,
                },
              },
              transaction,
            );

            return {
              skipped: false as const,
              task,
            };
          },
        );

      if (result.skipped) {
        return {
          actionId: ACTION_ID,
          actionName: ACTION_NAME,
          success: true,
          skipped: true,
          data: {
            taskId: result.taskId,
            reason:
              "Task check-out già presente.",
          },
        };
      }

      return {
        actionId: ACTION_ID,
        actionName: ACTION_NAME,
        success: true,
        data: {
          task: {
            id: result.task.id,
            title: result.task.title,
            status: result.task.status,
          },
        },
      };
    },
  };


