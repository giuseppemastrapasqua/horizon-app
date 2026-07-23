import type { SystemEvent } from "@prisma/client";
import {
  executeWorkflowsForEvent,
  registerImperiumWorkflows,
} from "@/lib/imperium/workflow";
import { imperiumLogger } from "@/lib/imperium";

export async function handleBookingCreated(
  event: SystemEvent
): Promise<void> {
  const payload = event.payload as {
    bookingId?: string;
    propertyId?: string;
  };

  if (!payload.bookingId) {
    throw new Error(
      "BOOKING_CREATED senza bookingId nel payload."
    );
  }

  registerImperiumWorkflows();

  const workflowResults =
    await executeWorkflowsForEvent(event);

  const failedWorkflows = workflowResults.filter(
    (result) => Boolean(result.error)
  );

  imperiumLogger.info(
    "BOOKING_CREATED processato",
    {
      eventType: event.eventType,
      eventId: event.id,
      bookingId: payload.bookingId,
      propertyId: payload.propertyId ?? null,
      workflowResults,
    }
  );

  if (failedWorkflows.length > 0) {
    imperiumLogger.error(
      "Uno o più workflow BOOKING_CREATED sono falliti",
      {
        eventId: event.id,
        bookingId: payload.bookingId,
        failedWorkflows,
      }
    );

    throw new Error(
      failedWorkflows
        .map(
          (result) =>
            `${result.workflowName}: ${result.error}`
        )
        .join(" | ")
    );
  }
}