"use server";

import {
  PropertyTaskAssignmentRole,
  RecordStatus,
} from "@prisma/client";

import { revalidatePath } from "next/cache";

import { requirePropertyAccess } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

const assignmentRoles = [
  PropertyTaskAssignmentRole.CLEANING,
  PropertyTaskAssignmentRole.MAINTENANCE,
  PropertyTaskAssignmentRole.OPERATIONS,
];

export async function updatePropertyTaskAssignmentsAction(
  formData: FormData,
): Promise<void> {
  const propertyId = String(
    formData.get("propertyId") || "",
  );

  if (!propertyId) {
    throw new Error(
      "Immobile non specificato.",
    );
  }

  await requirePropertyAccess(propertyId);

  const property =
    await prisma.property.findUnique({
      where: {
        id: propertyId,
      },
      select: {
        id: true,
      },
    });

  if (!property) {
    throw new Error(
      "Immobile non trovato.",
    );
  }

  const assignments = [
    {
      role:
        PropertyTaskAssignmentRole.CLEANING,
      userId: String(
        formData.get("cleaningUserId") || "",
      ),
    },
    {
      role:
        PropertyTaskAssignmentRole.MAINTENANCE,
      userId: String(
        formData.get("maintenanceUserId") || "",
      ),
    },
    {
      role:
        PropertyTaskAssignmentRole.OPERATIONS,
      userId: String(
        formData.get("operationsUserId") || "",
      ),
    },
  ];

  const selectedUserIds =
    assignments
      .map((assignment) =>
        assignment.userId,
      )
      .filter(Boolean);

  if (selectedUserIds.length > 0) {
    const validUsers =
      await prisma.user.findMany({
        where: {
          id: {
            in: selectedUserIds,
          },
          status:
            RecordStatus.ACTIVE,
        },
        select: {
          id: true,
        },
      });

    const validUserIds =
      new Set(
        validUsers.map(
          (user) => user.id,
        ),
      );

    for (const userId of selectedUserIds) {
      if (!validUserIds.has(userId)) {
        throw new Error(
          "Uno degli utenti selezionati non è valido o non è attivo.",
        );
      }
    }
  }

  await prisma.$transaction(
    async (transaction) => {
      for (const role of assignmentRoles) {
        const assignment =
          assignments.find(
            (item) =>
              item.role === role,
          );

        const userId =
          assignment?.userId ?? "";

        if (!userId) {
          await transaction.propertyTaskAssignment.deleteMany({
            where: {
              propertyId,
              role,
            },
          });

          continue;
        }

        await transaction.propertyTaskAssignment.upsert({
          where: {
            propertyId_role: {
              propertyId,
              role,
            },
          },
          update: {
            userId,
            active: true,
          },
          create: {
            propertyId,
            userId,
            role,
            active: true,
          },
        });
      }
    },
  );

  revalidatePath(
    `/properties/${propertyId}/edit`,
  );

  revalidatePath(
    `/properties/${propertyId}`,
  );
}