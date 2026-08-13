import { executeAction } from "../../actions";
import type { ImperiumWorkflow } from "../types";

export const bookingCancelledWorkflow: ImperiumWorkflow =
  {
    id: "booking-cancelled",
    name: "Booking Cancelled",
    description:
      "Workflow eseguito quando una prenotazione viene cancellata.",

    trigger: "BOOKING_CANCELLED",
    priority: 100,

    actions: [
      async (context) => {
        const result = await executeAction(
          "booking.cancel-open-tasks",
          context,
        );

        if (!result.success) {
          throw new Error(
            result.error ??
              "Errore durante l'annullamento dei task aperti della prenotazione.",
          );
        }
      },
    ],
  };