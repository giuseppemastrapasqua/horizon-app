import { prisma } from "@/lib/prisma";

export async function getImperiumMonitorEvent(
  eventId: string
) {
  return prisma.systemEvent.findUnique({
    where: {
      id: eventId,
    },
    select: {
      id: true,
      eventType: true,
      aggregateType: true,
      aggregateId: true,
      source: true,
      status: true,
      payload: true,
      idempotencyKey: true,
      externalEventId: true,
      correlationId: true,
      causationId: true,
      attempts: true,
      lastError: true,
      availableAt: true,
      processingAt: true,
      processedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}