"use server";

import { AuditAction } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

export async function markTaskDone(
  taskId: string,
): Promise<void> {
  await updateTaskStatus(
    taskId,
    "DONE",
    "Attività operativa completata.",
  );

  revalidateTaskPaths();
}

export async function reopenTask(
  taskId: string,
): Promise<void> {
  await updateTaskStatus(
    taskId,
    "TODO",
    "Attività operativa riaperta.",
  );

  revalidateTaskPaths();
}

async function updateTaskStatus(
  taskId: string,
  newStatus: "TODO" | "DONE",
  description: string,
): Promise<void> {
  await prisma.$transaction(
    async (transaction) => {
      const existingTask =
        await transaction.task.findUnique({
          where: {
            id: taskId,
          },
          select: {
            id: true,
            propertyId: true,
            bookingId: true,
            ownerId: true,
            title: true,
            status: true,
          },
        });

      if (!existingTask) {
        throw new Error(
          "Attività operativa non trovata.",
        );
      }

      if (existingTask.status === newStatus) {
        return;
      }

      const updatedTask =
        await transaction.task.update({
          where: {
            id: taskId,
          },
          data: {
            status: newStatus,
          },
          select: {
            id: true,
            propertyId: true,
            bookingId: true,
            ownerId: true,
            title: true,
            status: true,
          },
        });

      await AuditService.log(
        {
          action: AuditAction.UPDATE,
          propertyId: updatedTask.propertyId,
          entityType: AUDIT_ENTITY_TYPES.TASK,
          entityId: updatedTask.id,
          description,
          metadata: {
            title: updatedTask.title,
            bookingId: updatedTask.bookingId,
            ownerId: updatedTask.ownerId,
            previousStatus:
              existingTask.status,
            newStatus: updatedTask.status,
          },
        },
        transaction,
      );
    },
  );
}

function revalidateTaskPaths(): void {
  revalidatePath("/tasks");
  revalidatePath("/");
}