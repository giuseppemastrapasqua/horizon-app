export type OperationalInsight = {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "info";
};

type BookingInsightInput = {
  checkIn: string;
  checkOut: string;
  bookingStatus: string;
  operationalStatus: string;
  nights: number;
  guests: number;
  grossAmount: number;
  currency: string;
};

export function getBookingOperationalInsights(
  booking: BookingInsightInput
): OperationalInsight[] {
  const now = new Date();
  const checkIn = new Date(booking.checkIn);
  const checkOut = new Date(booking.checkOut);

  const daysUntilCheckIn = calculateDaysUntil(now, checkIn);
  const daysUntilCheckOut = calculateDaysUntil(now, checkOut);

  const insights: OperationalInsight[] = [];

  if (daysUntilCheckIn > 1) {
    insights.push({
      label: "Check-in",
      value: `Tra ${daysUntilCheckIn} giorni`,
      tone: "info",
    });
  } else if (daysUntilCheckIn === 1) {
    insights.push({
      label: "Check-in",
      value: "Domani",
      tone: "warning",
    });
  } else if (daysUntilCheckIn === 0) {
    insights.push({
      label: "Check-in",
      value: "Oggi",
      tone: "warning",
    });
  } else if (daysUntilCheckOut >= 0) {
    insights.push({
      label: "Soggiorno",
      value:
        daysUntilCheckOut === 0
          ? "Check-out oggi"
          : `In corso · check-out tra ${daysUntilCheckOut} giorni`,
      tone: "success",
    });
  } else {
    insights.push({
      label: "Soggiorno",
      value: "Concluso",
      tone: "info",
    });
  }

  insights.push({
    label: "Stato prenotazione",
    value: booking.bookingStatus,
    tone:
      booking.bookingStatus === "CONFIRMED"
        ? "success"
        : booking.bookingStatus === "CANCELLED"
          ? "danger"
          : "info",
  });

  insights.push({
    label: "Stato operativo",
    value: booking.operationalStatus,
    tone:
      booking.operationalStatus === "OK"
        ? "success"
        : booking.operationalStatus === "ALERT"
          ? "danger"
          : "warning",
  });

  insights.push({
    label: "Capienza",
    value: `${booking.guests} ospiti · ${booking.nights} notti`,
    tone: "info",
  });

  insights.push({
    label: "Valore soggiorno",
    value: formatCurrency(
      booking.grossAmount,
      booking.currency
    ),
    tone: booking.grossAmount > 0 ? "success" : "warning",
  });

  return insights;
}

function calculateDaysUntil(from: Date, to: Date) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.ceil(
    (to.getTime() - from.getTime()) / millisecondsPerDay
  );
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(amount);
}