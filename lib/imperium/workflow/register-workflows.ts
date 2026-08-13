import { registerImperiumActions } from "../actions";
import { bookingCancelledWorkflow } from "./definitions/booking-cancelled";
import { bookingCreatedWorkflow } from "./definitions/booking-created";
import { bookingUpdatedWorkflow } from "./definitions/booking-updated";
import { registerWorkflow } from "./registry";

let workflowsRegistered = false;

export function registerImperiumWorkflows() {
  if (workflowsRegistered) {
    return;
  }

  registerImperiumActions();

  registerWorkflow(
    bookingCreatedWorkflow,
  );

  registerWorkflow(
    bookingUpdatedWorkflow,
  );

  registerWorkflow(
    bookingCancelledWorkflow,
  );

  workflowsRegistered = true;
}