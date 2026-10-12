import { registerEventHandler } from "./handlers/index";
import { handleBookingCreated } from "./handlers/booking-created";
import { handleBookingT48Scheduling } from "./handlers/booking-t48-scheduling";
import { handleTaskCreated } from "./handlers/task-created";
import { handleRoss1000SubmissionScheduling } from "./handlers/ross1000-submission-scheduling";

let handlersRegistered = false;

export function registerHorizonEventHandlers() {
  if (handlersRegistered) {
    return;
  }

  registerEventHandler(
    "BOOKING_CREATED",
    handleBookingCreated,
  );

  registerEventHandler(
    "BOOKING_CREATED",
    handleBookingT48Scheduling,
  );

  registerEventHandler(
    "BOOKING_UPDATED",
    handleBookingT48Scheduling,
  );

  registerEventHandler(
    "BOOKING_CREATED",
    handleRoss1000SubmissionScheduling,
  );

  registerEventHandler(
    "BOOKING_UPDATED",
    handleRoss1000SubmissionScheduling,
  );

  registerEventHandler(
    "BOOKING_CANCELLED",
    handleRoss1000SubmissionScheduling,
  );

  registerEventHandler(
    "TASK_CREATED",
    handleTaskCreated,
  );

  handlersRegistered = true;
}
