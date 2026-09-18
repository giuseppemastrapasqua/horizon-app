import { registerEventHandler } from "./handlers/index";
import { handleBookingCreated } from "./handlers/booking-created";
import { handleBookingT48Scheduling } from "./handlers/booking-t48-scheduling";
import { handleTaskCreated } from "./handlers/task-created";

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
    "TASK_CREATED",
    handleTaskCreated,
  );

  handlersRegistered = true;
}
