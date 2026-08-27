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
  checkIn?: string;
};

const ACTION_ID =
  "booking.create-documents-task";

const ACTION_NAME =
  "Create guest documents task";

export const createDocumentsTaskAction: ImperiumAction =
  {
    id: ACTION_ID,
    name: ACTION_NAME,
    description:
      "Crea il task di controllo documenti per una nuova prenotazione.",

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

      const title =
        `Controllo documenti · ${
          payload.guestName ??
          bookingId
        }`;

      const checkIn = payload.checkIn
        ? new Date(payload.checkIn)
        : null;

      const dueDate = checkIn
        ? createTaskDate(
            checkIn,
            -2,
            18,
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

            const ownerId =
              await resolveTaskAssignee(
                propertyId,
                TaskType.GUEST_DOCUMENTS,
                transaction,
              );

            if (!ownerId) {
              throw new Error(
                "Nessun assegnatario disponibile per il task documenti.",
              );
            }

            const task =
              await transaction.task.create({
                data: {
                  title,
                  description:
                    "Verificare che i documenti degli ospiti siano completi prima dell'arrivo.",
                  type:
                    TaskType.GUEST_DOCUMENTS,
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
                  "Attività di controllo documenti creata automaticamente dal workflow.",
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

            await emitEvent(
              {
                eventType: "TASK_CREATED",
                aggregateType: "TASK",
                aggregateId: task.id,
                payload: {
                  taskId: task.id,
                  propertyId: task.propertyId,
                  bookingId: task.bookingId,
                  ownerId: task.ownerId,
                  type: task.type,
                },
                idempotencyKey:
                  `task-created:${task.id}`,
                causationId:
                  context.event.id,
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
              "Task documenti già presente.",
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
