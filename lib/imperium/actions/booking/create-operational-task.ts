import {
  AuditAction,
  TaskStatus,
  TaskType,
} from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

import type { ImperiumAction } from "../types";

type BookingCreatedPayload = {
  bookingId?: string;
  propertyId?: string;
  ownerId?: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
};

const ACTION_ID =
  "booking.create-operational-task";

const ACTION_NAME =
  "Create operational booking task";

export const createOperationalTaskAction: ImperiumAction =
  {
    id: ACTION_ID,
    name: ACTION_NAME,
    description:
      "Crea un task operativo di controllo quando viene registrata una prenotazione.",

    async execute(context) {
      const payload =
        context.event
          .payload as BookingCreatedPayload;

      if (!payload.bookingId) {
        return {
          actionId: ACTION_ID,
          actionName: ACTION_NAME,
          success: false,
          error:
            "BOOKING_CREATED senza bookingId nel payload.",
        };
      }

      if (!payload.propertyId) {
        return {
          actionId: ACTION_ID,
          actionName: ACTION_NAME,
          success: false,
          error:
            "BOOKING_CREATED senza propertyId nel payload.",
        };
      }

      const bookingId = payload.bookingId;
      const propertyId = payload.propertyId;
      const ownerId = payload.ownerId ?? null;

      const title =
        `IMPERIUM · Verifica prenotazione ${
          payload.guestName ??
          bookingId
        }`;

      const dueDate = payload.checkIn
        ? new Date(payload.checkIn)
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
                    "Controllo automatico generato da IMPERIUM dopo la creazione della prenotazione.",
                  type: TaskType.ADMIN,
                  status: TaskStatus.TODO,
                  propertyId,
                  bookingId,
                  ownerId,
                  dueDate,
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
                  "Attività operativa creata automaticamente dal workflow.",
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
              "Task già presente.",
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