import type {
  IntelligenceInsight,
} from "./intelligence-types";

export type DocumentIntelligenceInput = {
  id: string;

  title: string;

  type:
    | "MONTHLY_REPORT"
    | "COMMISSION_INVOICE"
    | "MAINTENANCE_REPORT"
    | "PROPERTY_REPORT"
    | "PORTFOLIO_REPORT"
    | "PROPERTY_STATEMENT";

  status:
    | "DRAFT"
    | "FINAL"
    | "ISSUED"
    | "ARCHIVED";

  referenceMonth:
    Date | null;

  updatedAt:
    Date;

  propertyId:
    string | null;

  propertyName:
    string | null;
};

export function buildDocumentInsights({
  documents,
  now = new Date(),
}: {
  documents: DocumentIntelligenceInput[];
  now?: Date;
}): IntelligenceInsight[] {
  const insights:
    IntelligenceInsight[] = [];

  for (const document of documents) {
    if (
      document.status === "ARCHIVED"
    ) {
      continue;
    }

    const ageDays =
      differenceInDays(
        now,
        document.updatedAt,
      );

    const isDraft =
      document.status === "DRAFT";

    const isMonthly =
      document.type ===
        "MONTHLY_REPORT" ||
      document.type ===
        "PROPERTY_STATEMENT";

    /*
     * 1. BOZZA FERMA
     */
    if (
      isDraft &&
      ageDays >= 7
    ) {
      insights.push({
        id:
          `document-stale:${document.id}`,

        propertyId:
          document.propertyId ??
          "portfolio",

        propertyName:
          document.propertyName ??
          "Portfolio Horizon",

        category:
          "DOCUMENTS",

        severity:
          ageDays >= 14
            ? "WARNING"
            : "INFO",

        title:
          "Documento in bozza da verificare",

        explanation:
          `"${document.title}" è in bozza da ${ageDays} giorni e non risulta ancora finalizzato.`,

        action: {
          type:
            "REVIEW_DOCUMENT",

          label:
            "Apri documento",

          href:
            `/documents`,

          requiresApproval:
            false,
        },

        metadata: {
          documentId:
            document.id,

          documentType:
            document.type,

          documentStatus:
            document.status,

          ageDays,
        },
      });
    }

    /*
     * 2. DOCUMENTO MENSILE NON FINALIZZATO
     */
    if (
      isMonthly &&
      document.referenceMonth !== null &&
      (
        document.status === "DRAFT"
      )
    ) {
      const monthEnd =
        endOfMonth(
          document.referenceMonth,
        );

      if (
        now > monthEnd
      ) {
        insights.push({
          id:
            `document-monthly-open:${document.id}`,

          propertyId:
            document.propertyId ??
            "portfolio",

          propertyName:
            document.propertyName ??
            "Portfolio Horizon",

          category:
            "DOCUMENTS",

          severity:
            "WARNING",

          title:
            "Documento mensile ancora aperto",

          explanation:
            `"${document.title}" è riferito a un mese già concluso ma risulta ancora in bozza.`,

          date:
            dateKey(
              document.referenceMonth,
            ),

          action: {
            type:
              "REVIEW_DOCUMENT",

            label:
              "Verifica documento",

            href:
              `/documents`,

            requiresApproval:
              false,
          },

          metadata: {
            documentId:
              document.id,

            referenceMonth:
              dateKey(
                document.referenceMonth,
              ),

            documentType:
              document.type,
          },
        });
      }
    }

    /*
     * 3. DOCUMENTO IMMOBILE SENZA STRUTTURA
     */
    const shouldHaveProperty =
      document.type ===
        "MONTHLY_REPORT" ||
      document.type ===
        "PROPERTY_REPORT" ||
      document.type ===
        "PROPERTY_STATEMENT" ||
      document.type ===
        "MAINTENANCE_REPORT";

    if (
      shouldHaveProperty &&
      document.propertyId === null
    ) {
      insights.push({
        id:
          `document-property-missing:${document.id}`,

        propertyId:
          "portfolio",

        propertyName:
          "Portfolio Horizon",

        category:
          "DOCUMENTS",

        severity:
          "WARNING",

        title:
          "Documento senza struttura associata",

        explanation:
          `"${document.title}" dovrebbe essere collegato a una struttura ma non risulta associato a nessun immobile.`,

        action: {
          type:
            "REVIEW_DOCUMENT",

          label:
            "Controlla documento",

          href:
            `/documents`,

          requiresApproval:
            false,
        },

        metadata: {
          documentId:
            document.id,

          documentType:
            document.type,
        },
      });
    }
  }

  return insights
    .sort(
      (left, right) =>
        severityWeight(
          right.severity,
        ) -
        severityWeight(
          left.severity,
        ),
    )
    .slice(
      0,
      8,
    );
}

function differenceInDays(
  later: Date,
  earlier: Date,
) {
  return Math.floor(
    (
      later.getTime() -
      earlier.getTime()
    ) /
      (
        1000 *
        60 *
        60 *
        24
      ),
  );
}

function endOfMonth(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
}

function dateKey(
  date: Date,
) {
  return date
    .toISOString()
    .slice(0, 10);
}

function severityWeight(
  severity:
    IntelligenceInsight["severity"],
) {
  switch (severity) {
    case "CRITICAL":
      return 4;

    case "WARNING":
      return 3;

    case "OPPORTUNITY":
      return 2;

    case "INFO":
    default:
      return 1;
  }
}
