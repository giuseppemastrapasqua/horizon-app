import { executeAction } from "../../actions";
import type { ImperiumWorkflow } from "../types";

export const bookingCreatedWorkflow: ImperiumWorkflow = {
  id: "booking-created",
  name: "Booking Created",
  description:
    "Workflow eseguito quando viene creata una prenotazione.",

  trigger: "BOOKING_CREATED",
  priority: 100,

  actions: [
    async (context) => {
      const result = await executeAction(
        "booking.create-documents-task",
        context
      );

      if (!result.success) {
        throw new Error(
          result.error ??
            "Errore durante la creazione del task documenti."
        );
      }
    },

    async (context) => {
  const result = await executeAction(
    "booking.create-cleaning-task",
    context
  );

  if (!result.success) {
    throw new Error(
      result.error ??
        "Errore durante la creazione del task pulizia."
    );
  }
},

async (context) => {
  const result = await executeAction(
    "booking.create-checkout-task",
    context
  );

  if (!result.success) {
    throw new Error(
      result.error ??
        "Errore durante la creazione del task check-out."
    );
  }
},

    async (context) => {
      const result = await executeAction(
        "booking.create-operational-task",
        context
      );

      if (!result.success) {
        throw new Error(
          result.error ??
            "Errore durante la creazione del task operativo."
        );
      }
    },
  ],
};