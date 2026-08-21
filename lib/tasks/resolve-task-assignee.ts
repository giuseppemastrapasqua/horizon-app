import {
  Prisma,
  PropertyTaskAssignmentRole,
  TaskType,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

function assignmentRoleForTask(
  type: TaskType,
): PropertyTaskAssignmentRole {
  switch (type) {
    case TaskType.CLEANING:
      return PropertyTaskAssignmentRole.CLEANING;

    case TaskType.MAINTENANCE:
      return PropertyTaskAssignmentRole.MAINTENANCE;

    case TaskType.GUEST_DOCUMENTS:
    case TaskType.CHECK_IN:
    case TaskType.CHECK_OUT:
    case TaskType.ADMIN:
    case TaskType.ISSUE:
      return PropertyTaskAssignmentRole.OPERATIONS;
  }
}

export async function resolveTaskAssignee(
  propertyId: string,
  type: TaskType,
  transaction?: Prisma.TransactionClient,
): Promise<string | null> {
  const client =
    transaction ?? prisma;

  const role =
    assignmentRoleForTask(type);

  const assignment =
    await client.propertyTaskAssignment.findFirst({
      where: {
        propertyId,
        role,
        active: true,
        user: {
          status: "ACTIVE",
        },
      },
      select: {
        userId: true,
      },
    });

  if (assignment) {
    return assignment.userId;
  }

  const property =
    await client.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        ownerId: true,
      },
    });

  return property?.ownerId ?? null;
}
