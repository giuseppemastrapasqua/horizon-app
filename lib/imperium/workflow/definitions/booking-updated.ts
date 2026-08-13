import { executeAction } from "../../actions";
import type { ImperiumWorkflow } from "../types";

export const bookingUpdatedWorkflow: ImperiumWorkflow =
  {
    id: "booking-updated",
    name: "Booking Updated",
    description:
      "Workflow eseguito quando una prenotazione viene aggiornata.",

    trigger: "BOOKING_UPDATED",
    priority: 100,

    actions: [
      async (context) => {
        const result =
          await executeAction(
            "booking.update-open-tasks",
            context,
          );

        if (!result.success) {
          throw new Error(
            result.error ??
              "Errore durante l'aggiornamento dei task della prenotazione.",
          );
        }
      },
    ],
  };