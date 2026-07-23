import { registerEventHandler } from "./handlers/index";
import { handleBookingCreated } from "./handlers/booking-created";

let handlersRegistered = false;

export function registerHorizonEventHandlers() {
  if (handlersRegistered) {
    return;
  }

  registerEventHandler(
    "BOOKING_CREATED",
    handleBookingCreated
  );

  handlersRegistered = true;
}