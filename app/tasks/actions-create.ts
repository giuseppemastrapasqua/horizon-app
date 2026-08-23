"use server";

import {
  AuditAction,
  TaskType,
} from "@prisma/client";
import { redirect } from "next/navigation";

import { requirePropertyAccess, requireUser } from "@/lib/auth/guards";
import { AUDIT_ENTITY_TYPES } from "@/lib/audit/constants";
import { prisma } from "@/lib/prisma";
import { resolveTaskAssignee } from "@/lib/tasks/resolve-task-assignee";
import { AuditService } from "@/services/audit/AuditService";

function parseTaskType(
  value: FormDataEntryValue | null,
): TaskType {
  const taskType = String(
    value ?? TaskType.ADMIN,
  );

  if (
    Object.values(TaskType).includes(
      taskType as TaskType,
    )
  ) {
    return taskType as TaskType;
  }

  throw new Error(
    `Tipo di attività non valido: "${taskType}".`,
  );
}

export async function createTask(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();

  const propertyId = String(
    formData.get("propertyId") || "",
  );

  await requirePropertyAccess(propertyId);

  const bookingIdRaw = String(
    formData.get("bookingId") || "",
  );
const dueDateRaw = String(
    formData.get("dueDate") || "",
  );

  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      include: {
        owner: true,
      },
    });

  if (!property) {
    throw new Error(
      "Immobile non trovato.",
    );
  }

  const title = String(
    formData.get("title") || "",
  );

  const description = String(
    formData.get("description") || "",
  );

  const type = parseTaskType(
    formData.get("type"),
  );

  const dueDate = dueDateRaw
    ? new Date(dueDateRaw)
    : null;

  const bookingId =
    bookingIdRaw || null;
await prisma.$transaction(
    async (transaction) => {
      const ownerId =
        await resolveTaskAssignee(
          property.id,
          type,
          transaction,
        );
      const task =
        await transaction.task.create({
          data: {
            title,
            description,
            type,
            status: "TODO",
            dueDate,
            propertyId: property.id,
            bookingId,
            ownerId,
          },
        });

      await AuditService.log(
        {
          actorId:
            user.id,
          action: AuditAction.CREATE,
          propertyId: property.id,
          entityType:
            AUDIT_ENTITY_TYPES.TASK,
          entityId: task.id,
          description:
            "Attività operativa creata manualmente.",
          metadata: {
            title: task.title,
            description:
              task.description,
            type: task.type,
            status: task.status,
            dueDate:
              task.dueDate?.toISOString() ??
              null,
            bookingId: task.bookingId,
            ownerId: task.ownerId,
            creationSource: "MANUAL",
          },
        },
        transaction,
      );
    },
  );

  redirect(
    `/properties/${property.id}`,
  );
}