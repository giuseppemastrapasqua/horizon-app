import {
  AuditAction,
  TaskStatus,
} from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

import type { ImperiumAction } from "../types";

type BookingCancelledPayload = {
  bookingId?: string;
  propertyId?: string;
};

const ACTION_ID =
  "booking.cancel-open-tasks";

const ACTION_NAME =
  "Cancel open booking tasks";

export const cancelOpenBookingTasksAction: ImperiumAction =
  {
    id: ACTION_ID,
    name: ACTION_NAME,
    description:
      "Annulla i task ancora aperti quando una prenotazione viene cancellata.",

    async execute(context) {
      const payload =
        context.event
          .payload as BookingCancelledPayload;

      if (!payload.bookingId) {
        return {
          actionId: ACTION_ID,
          actionName: ACTION_NAME,
          success: false,
          error:
            "BOOKING_CANCELLED senza bookingId nel payload.",
        };
      }

      const bookingId = payload.bookingId;

      const result =
        await prisma.$transaction(
          async (transaction) => {
            const tasks =
              await transaction.task.findMany({
                where: {
                  bookingId,
                  status: {
                    in: [
                      TaskStatus.TODO,
                      TaskStatus.IN_PROGRESS,
                    ],
                  },
                },
                select: {
                  id: true,
                  propertyId: true,
                  title: true,
                  status: true,
                },
              });

            if (tasks.length === 0) {
              return {
                cancelledTasks: 0,
              };
            }

            await transaction.task.updateMany({
              where: {
                id: {
                  in: tasks.map(
                    (task) => task.id,
                  ),
                },
              },
              data: {
                status:
                  TaskStatus.CANCELLED,
              },
            });

            for (const task of tasks) {
              await AuditService.log(
                {
                  action:
                    AuditAction.STATUS_CHANGE,
                  propertyId:
                    task.propertyId,
                  entityType:
                    AUDIT_ENTITY_TYPES.TASK,
                  entityId: task.id,
                  description:
                    "Task annullato automaticamente in seguito alla cancellazione della prenotazione.",
                  metadata: {
                    bookingId,
                    previousStatus:
                      task.status,
                    newStatus:
                      TaskStatus.CANCELLED,
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
            }

            return {
              cancelledTasks:
                tasks.length,
            };
          },
        );

      return {
        actionId: ACTION_ID,
        actionName: ACTION_NAME,
        success: true,
        skipped:
          result.cancelledTasks === 0,
        data: {
          cancelledTasks:
            result.cancelledTasks,
        },
      };
    },
  };