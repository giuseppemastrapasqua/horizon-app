import {
  SystemEventSource,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  EmitEventInput,
  EmitEventResult,
} from "./types";

export async function emitEvent(
  input: EmitEventInput
): Promise<EmitEventResult> {
  const existingEvent = await prisma.systemEvent.findUnique({
    where: {
      idempotencyKey: input.idempotencyKey,
    },
    select: {
      id: true,
    },
  });

  if (existingEvent) {
    return {
      id: existingEvent.id,
      created: false,
    };
  }

  const event = await prisma.systemEvent.create({
    data: {
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId ?? null,
      source: input.source ?? SystemEventSource.HORIZON,
      payload: input.payload,
      idempotencyKey: input.idempotencyKey,
      externalEventId: input.externalEventId ?? null,
      correlationId: input.correlationId ?? null,
      causationId: input.causationId ?? null,
      availableAt: input.availableAt ?? new Date(),
    },
    select: {
      id: true,
    },
  });

  return {
    id: event.id,
    created: true,
  };
}