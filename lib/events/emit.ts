import {
  SystemEventSource,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type {
  EmitEventInput,
  EmitEventResult,
} from "./types";

export async function emitEvent(
  input: EmitEventInput,
  transaction?: Prisma.TransactionClient,
): Promise<EmitEventResult> {
  const client = transaction ?? prisma;

  const existingEvent =
    await client.systemEvent.findUnique({
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

  const event =
    await client.systemEvent.create({
      data: {
        eventType: input.eventType,
        aggregateType: input.aggregateType,
        aggregateId:
          input.aggregateId ?? null,
        source:
          input.source ??
          SystemEventSource.HORIZON,
        payload: input.payload,
        idempotencyKey:
          input.idempotencyKey,
        externalEventId:
          input.externalEventId ?? null,
        correlationId:
          input.correlationId ?? null,
        causationId:
          input.causationId ?? null,
        availableAt:
          input.availableAt ?? new Date(),
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