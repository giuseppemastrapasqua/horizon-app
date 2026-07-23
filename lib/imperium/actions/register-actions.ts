import { registerAction } from "./registry";
import { createOperationalTaskAction } from "./booking/create-operational-task";
import { createDocumentsTaskAction } from "./booking/create-documents-task";
import { createCleaningTaskAction } from "./booking/create-cleaning-task";
import { createCheckoutTaskAction } from "./booking/create-checkout-task";

let actionsRegistered = false;

export function registerImperiumActions() {
  if (actionsRegistered) {
    return;
  }

  registerAction(createDocumentsTaskAction);
  registerAction(createOperationalTaskAction);
  registerAction(createCleaningTaskAction);
  registerAction(createCheckoutTaskAction);

  actionsRegistered = true;
}