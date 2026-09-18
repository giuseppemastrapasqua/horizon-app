import type { SystemEvent } from "@prisma/client";

import { scheduleBookingT48OperatorAlert } from "@/lib/bookings/schedule-booking-t48-operator-alert";

export async function handleBookingT48Scheduling(
  event: SystemEvent,
): Promise<void> {
  const payload = event.payload as {
    bookingId?: string;
  };

  const bookingId =
    payload.bookingId ?? event.aggregateId;

  if (!bookingId) {
    throw new Error(
      `${event.eventType} senza bookingId per scheduling T-48.`,
    );
  }

  await scheduleBookingT48OperatorAlert(
    bookingId,
  );
}
