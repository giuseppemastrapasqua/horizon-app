import { cancelOpenBookingTasksAction } from "./booking/cancel-open-tasks";
import { createCheckoutTaskAction } from "./booking/create-checkout-task";
import { createCleaningTaskAction } from "./booking/create-cleaning-task";
import { createDocumentsTaskAction } from "./booking/create-documents-task";
import { createOperationalTaskAction } from "./booking/create-operational-task";
import { updateOpenBookingTasksAction } from "./booking/update-open-tasks";
import { registerAction } from "./registry";

let actionsRegistered = false;

export function registerImperiumActions() {
  if (actionsRegistered) {
    return;
  }

  registerAction(
    createDocumentsTaskAction,
  );

  registerAction(
    createOperationalTaskAction,
  );

  registerAction(
    createCleaningTaskAction,
  );

  registerAction(
    createCheckoutTaskAction,
  );

  registerAction(
    cancelOpenBookingTasksAction,
  );

  registerAction(
    updateOpenBookingTasksAction,
  );

  actionsRegistered = true;
}