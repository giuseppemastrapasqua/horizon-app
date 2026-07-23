import { registerImperiumActions } from "../actions";
import { bookingCreatedWorkflow } from "./definitions/booking-created";
import { registerWorkflow } from "./registry";

let workflowsRegistered = false;

export function registerImperiumWorkflows() {
  if (workflowsRegistered) {
    return;
  }

  registerImperiumActions();
  registerWorkflow(bookingCreatedWorkflow);

  workflowsRegistered = true;
}