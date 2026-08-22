import type {
  IntelligenceInsight,
} from "./intelligence-types";

export type MissingFinanceReportPropertyInput = {
  id: string;
  name: string;
};

export type MissingFinanceReportBookingInput = {
  id: string;
  propertyId: string;
  checkIn: Date;
  grossAmount: number;
};

export type ExistingFinanceReportInput = {
  id: string;
  propertyId: string;
  referenceMonth: Date;
};

export function buildMissingFinanceReportInsights({
  properties,
  bookings,
  reports,
  now = new Date(),
}: {
  properties: MissingFinanceReportPropertyInput[];
  bookings: MissingFinanceReportBookingInput[];
  reports: ExistingFinanceReportInput[];
  now?: Date;
}): IntelligenceInsight[] {
  const insights: IntelligenceInsight[] = [];

  /*
   * Analizziamo esclusivamente il mese
   * solare precedente.
   *
   * In questo modo non segnaliamo il mese
   * corrente mentre è ancora in corso.
   */
  const previousMonthStart =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - 1,
        1,
      ),
    );

  const currentMonthStart =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1,
      ),
    );

  const reportPropertyIds =
    new Set(
      reports
        .filter(
          (report) =>
            sameMonth(
              report.referenceMonth,
              previousMonthStart,
            ),
        )
        .map(
          (report) =>
            report.propertyId,
        ),
    );

  for (const property of properties) {
    if (
      reportPropertyIds.has(
        property.id,
      )
    ) {
      continue;
    }

    const monthBookings =
      bookings.filter(
        (booking) =>
          booking.propertyId ===
            property.id &&
          booking.checkIn >=
            previousMonthStart &&
          booking.checkIn <
            currentMonthStart,
      );

    /*
     * Nessuna attività economica:
     * nessun rendiconto richiesto.
     */
    if (
      monthBookings.length === 0
    ) {
      continue;
    }

    const grossRevenue =
      monthBookings.reduce(
        (total, booking) =>
          total +
          booking.grossAmount,
        0,
      );

    insights.push({
      id:
        `finance-report-missing:${property.id}:${dateKey(
          previousMonthStart,
        )}`,

      propertyId:
        property.id,

      propertyName:
        property.name,

      category:
        "FINANCE",

      severity:
        grossRevenue >= 5000
          ? "WARNING"
          : "INFO",

      title:
        "Rendiconto mensile da generare",

      explanation:
        `Nel mese precedente risultano ${monthBookings.length} prenotazioni per circa ${formatAmount(
          grossRevenue,
        )} EUR di lordo, ma non risulta ancora generato il rendiconto.`,

      date:
        dateKey(
          previousMonthStart,
        ),

      economicImpact: {
        amount:
          grossRevenue,

        currency:
          "EUR",

        direction:
          "UNKNOWN",
      },

      action: {
        type:
          "REVIEW_FINANCE",

        label:
          "Genera rendiconto",

        href:
          `/reports/monthly/property?propertyId=${encodeURIComponent(
            property.id,
          )}&referenceMonth=${encodeURIComponent(
            monthKey(previousMonthStart),
          )}`,

        propertyId:
          property.id,

        requiresApproval:
          false,
      },

      metadata: {
        referenceMonth:
          dateKey(
            previousMonthStart,
          ),

        bookingsCount:
          monthBookings.length,

        grossRevenue,
      },
    });
  }

  return insights
    .sort(
      (left, right) =>
        (
          right.economicImpact
            ?.amount ?? 0
        ) -
        (
          left.economicImpact
            ?.amount ?? 0
        ),
    )
    .slice(
      0,
      8,
    );
}

function sameMonth(
  left: Date,
  right: Date,
) {
  return (
    left.getUTCFullYear() ===
      right.getUTCFullYear() &&
    left.getUTCMonth() ===
      right.getUTCMonth()
  );
}

function dateKey(
  date: Date,
) {
  return date
    .toISOString()
    .slice(0, 10);
}

function formatAmount(
  amount: number,
) {
  return new Intl.NumberFormat(
    "it-IT",
    {
      maximumFractionDigits: 0,
    },
  ).format(amount);
}

function monthKey(
  date: Date,
) {
  return date
    .toISOString()
    .slice(0, 7);
}
