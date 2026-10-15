import type { SystemEvent } from "@prisma/client";

import { enqueueBackgroundJob } from "@/lib/job/enqueue-background-job";

const ROSS1000_BOOKING_EVENT_TYPES = [
  "BOOKING_CREATED",
  "BOOKING_UPDATED",
  "BOOKING_CANCELLED",
] as const;

type Ross1000BookingEventType =
  (typeof ROSS1000_BOOKING_EVENT_TYPES)[number];

function isRoss1000BookingEventType(
  eventType: string,
): eventType is Ross1000BookingEventType {
  return ROSS1000_BOOKING_EVENT_TYPES.some(
    (candidate) => candidate === eventType,
  );
}

export async function handleRoss1000SubmissionScheduling(
  event: SystemEvent,
): Promise<void> {
  if (!isRoss1000BookingEventType(event.eventType)) {
    throw new Error(
      `Evento ${event.eventType} non supportato per ROSS1000.`,
    );
  }

  if (process.env.HORIZON_ROSS1000_EVENT_PREPARATION_ENABLED !== "true") return;

  const payload = event.payload as {
    bookingId?: string;
    propertyId?: string;
  };

  const bookingId =
    payload.bookingId ?? event.aggregateId;

  if (!bookingId) {
    throw new Error(
      `${event.eventType} senza bookingId per scheduling ROSS1000.`,
    );
  }

  await enqueueBackgroundJob({
    type: "ROSS1000_SUBMISSION",
    payload: {
      bookingId,
      propertyId: payload.propertyId ?? null,
      eventType: event.eventType,
      sourceEventId: event.id,
    },
    deduplicationKey:
      `ROSS1000_SUBMISSION:${event.id}`,
  });
}
