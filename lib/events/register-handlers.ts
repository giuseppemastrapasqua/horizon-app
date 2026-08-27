import { registerEventHandler } from "./handlers/index";
import { handleBookingCreated } from "./handlers/booking-created";
import { handleTaskCreated } from "./handlers/task-created";

let handlersRegistered = false;

export function registerHorizonEventHandlers() {
  if (handlersRegistered) {
    return;
  }

  registerEventHandler(
    "BOOKING_CREATED",
    handleBookingCreated
  );

  registerEventHandler(
    "TASK_CREATED",
    handleTaskCreated
  );

  handlersRegistered = true;
}
