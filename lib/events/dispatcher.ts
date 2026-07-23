import {
  SystemEventStatus,
  type SystemEvent,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getEventHandlers } from "./handlers/index";
import type { HorizonEventType } from "./types";

export async function dispatchEvent(
  event: SystemEvent
): Promise<void> {
  const handlers = getEventHandlers(
    event.eventType as HorizonEventType
  );

  if (handlers.length === 0) {
    await prisma.systemEvent.update({
      where: {
        id: event.id,
      },
      data: {
        status: SystemEventStatus.COMPLETED,
        processedAt: new Date(),
        lastError: null,
      },
    });

    return;
  }

  await prisma.systemEvent.update({
    where: {
      id: event.id,
    },
    data: {
      status: SystemEventStatus.PROCESSING,
      processingAt: new Date(),
      attempts: {
        increment: 1,
      },
      lastError: null,
    },
  });

  try {
    for (const handler of handlers) {
      await handler(event);
    }

    await prisma.systemEvent.update({
      where: {
        id: event.id,
      },
      data: {
        status: SystemEventStatus.COMPLETED,
        processedAt: new Date(),
        lastError: null,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Errore sconosciuto durante il dispatch.";

    await prisma.systemEvent.update({
      where: {
        id: event.id,
      },
      data: {
        status: SystemEventStatus.FAILED,
        lastError: message,
      },
    });

    throw error;
  }
}