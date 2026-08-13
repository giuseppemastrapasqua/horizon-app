import { AuditAction, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CreateAuditLogInput = {
  actorId?: string | null;
  action: AuditAction;

  propertyId?: string | null;

  entityType: string;
  entityId?: string | null;

  description?: string | null;
  metadata?: Prisma.InputJsonValue;

  ipAddress?: string | null;
  userAgent?: string | null;
};

type AuditDatabaseClient =
  | typeof prisma
  | Prisma.TransactionClient;

export class AuditService {
  static async log(
    input: CreateAuditLogInput,
    database: AuditDatabaseClient = prisma,
  ) {
    return database.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        propertyId: input.propertyId ?? null,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        description: input.description ?? null,
        metadata: input.metadata,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  static async getPropertyTimeline(propertyId: string) {
    return prisma.auditLog.findMany({
      where: {
        propertyId,
      },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
    });
  }
}