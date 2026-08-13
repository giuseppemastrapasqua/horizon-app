import {
  AuditAction,
  TaskStatus,
  TaskType,
} from "@prisma/client";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

import { createTaskDate } from "../../shared";
import type { ImperiumAction } from "../types";

type BookingUpdatedPayload = {
  bookingId?: string;
  propertyId?: string;
  ownerId?: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
};

const ACTION_ID =
  "booking.update-open-tasks";

const ACTION_NAME =
  "Update open booking tasks";

export const updateOpenBookingTasksAction: ImperiumAction =
  {
    id: ACTION_ID,
    name: ACTION_NAME,
    description:
      "Aggiorna i task operativi ancora aperti quando cambiano i dati della prenotazione.",

    async execute(context) {
      const payload =
        context.event
          .payload as BookingUpdatedPayload;

      if (!payload.bookingId) {
        return {
          actionId: ACTION_ID,
          actionName: ACTION_NAME,
          success: false,
          error:
            "BOOKING_UPDATED senza bookingId nel payload.",
        };
      }

      const bookingId = payload.bookingId;

      const checkIn = payload.checkIn
        ? new Date(payload.checkIn)
        : null;

      const checkOut = payload.checkOut
        ? new Date(payload.checkOut)
        : null;

      if (
        checkIn &&
        Number.isNaN(checkIn.getTime())
      ) {
        return {
          actionId: ACTION_ID,
          actionName: ACTION_NAME,
          success: false,
          error:
            "BOOKING_UPDATED contiene un checkIn non valido.",
        };
      }

      if (
        checkOut &&
        Number.isNaN(checkOut.getTime())
      ) {
        return {
          actionId: ACTION_ID,
          actionName: ACTION_NAME,
          success: false,
          error:
            "BOOKING_UPDATED contiene un checkOut non valido.",
        };
      }

      const guestLabel =
        payload.guestName?.trim() ||
        bookingId;

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
                  OR: [
                    {
                      type:
                        TaskType.GUEST_DOCUMENTS,
                      title: {
                        startsWith:
                          "Controllo documenti · ",
                      },
                    },
                    {
                      type:
                        TaskType.CLEANING,
                      title: {
                        startsWith:
                          "Pulizia pre check-in · ",
                      },
                    },
                    {
                      type:
                        TaskType.CHECK_OUT,
                      title: {
                        startsWith:
                          "Controllo check-out · ",
                      },
                    },
                    {
                      type:
                        TaskType.ADMIN,
                      title: {
                        startsWith:
                          "IMPERIUM · Verifica prenotazione ",
                      },
                    },
                  ],
                },
                select: {
                  id: true,
                  propertyId: true,
                  type: true,
                  title: true,
                  dueDate: true,
                },
              });

            let updatedTasks = 0;

            for (const task of tasks) {
              const update =
                getTaskUpdate({
                  type: task.type,
                  guestLabel,
                  checkIn,
                  checkOut,
                });

              if (!update) {
                continue;
              }

              const titleChanged =
                task.title !== update.title;

              const dueDateChanged =
                !sameDate(
                  task.dueDate,
                  update.dueDate,
                );

              if (
                !titleChanged &&
                !dueDateChanged
              ) {
                continue;
              }

              await transaction.task.update({
                where: {
                  id: task.id,
                },
                data: {
                  title: update.title,
                  dueDate:
                    update.dueDate,
                },
              });

              await AuditService.log(
                {
                  action:
                    AuditAction.UPDATE,
                  propertyId:
                    task.propertyId,
                  entityType:
                    AUDIT_ENTITY_TYPES.TASK,
                  entityId: task.id,
                  description:
                    "Task aggiornato automaticamente in seguito alla modifica della prenotazione.",
                  metadata: {
                    bookingId,
                    previousTitle:
                      task.title,
                    newTitle:
                      update.title,
                    previousDueDate:
                      task.dueDate?.toISOString() ??
                      null,
                    newDueDate:
                      update.dueDate?.toISOString() ??
                      null,
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

              updatedTasks += 1;
            }

            return {
              updatedTasks,
            };
          },
        );

      return {
        actionId: ACTION_ID,
        actionName: ACTION_NAME,
        success: true,
        skipped:
          result.updatedTasks === 0,
        data: {
          updatedTasks:
            result.updatedTasks,
        },
      };
    },
  };

function getTaskUpdate({
  type,
  guestLabel,
  checkIn,
  checkOut,
}: {
  type: TaskType;
  guestLabel: string;
  checkIn: Date | null;
  checkOut: Date | null;
}) {
  switch (type) {
    case TaskType.GUEST_DOCUMENTS:
      return {
        title:
          `Controllo documenti · ${guestLabel}`,
        dueDate: checkIn
          ? createTaskDate(
              checkIn,
              -2,
              18,
            )
          : null,
      };

    case TaskType.CLEANING:
      return {
        title:
          `Pulizia pre check-in · ${guestLabel}`,
        dueDate: checkIn
          ? createTaskDate(
              checkIn,
              -1,
              12,
            )
          : null,
      };

    case TaskType.CHECK_OUT:
      return {
        title:
          `Controllo check-out · ${guestLabel}`,
        dueDate: checkOut
          ? createTaskDate(
              checkOut,
              0,
              10,
            )
          : null,
      };

    case TaskType.ADMIN:
      return {
        title:
          `IMPERIUM · Verifica prenotazione ${guestLabel}`,
        dueDate: checkIn
          ? new Date(checkIn)
          : null,
      };

    default:
      return null;
  }
}

function sameDate(
  first: Date | null,
  second: Date | null,
): boolean {
  if (
    first === null ||
    second === null
  ) {
    return first === second;
  }

  return (
    first.getTime() ===
    second.getTime()
  );
}