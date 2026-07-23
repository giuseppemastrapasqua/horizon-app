import { SystemEventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { dispatchEvent } from "./dispatcher";
import { registerHorizonEventHandlers } from "./register-handlers";

type ProcessPendingEventsOptions = {
  limit?: number;
};

export async function processPendingEvents({
  limit = 20,
}: ProcessPendingEventsOptions = {}) {
registerHorizonEventHandlers();    
  const now = new Date();

  const events = await prisma.systemEvent.findMany({
    where: {
      status: {
        in: [
          SystemEventStatus.PENDING,
          SystemEventStatus.FAILED,
        ],
      },
      availableAt: {
        lte: now,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    take: limit,
  });

  const results = [];

  for (const event of events) {
    try {
      await dispatchEvent(event);

      results.push({
        eventId: event.id,
        success: true,
      });
    } catch (error) {
      results.push({
        eventId: event.id,
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Errore sconosciuto.",
      });
    }
  }

  return {
    processed: results.length,
    succeeded: results.filter((result) => result.success).length,
    failed: results.filter((result) => !result.success).length,
    results,
  };
}