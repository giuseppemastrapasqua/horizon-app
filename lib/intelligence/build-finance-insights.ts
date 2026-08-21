import type {
  IntelligenceInsight,
} from "./intelligence-types";

export type FinanceIntelligenceReportInput = {
  id: string;

  propertyId: string;
  propertyName: string;

  referenceMonth: Date;

  currency: string;

  grossRevenue: number;
  finalAmount: number;

  adjustments: {
    id: string;
    description: string;
    amount: number;
  }[];

  rules: {
    id: string;
    ruleName: string;

    operation:
      | "ADD"
      | "SUBTRACT";

    category:
      | "OTA_COMMISSION"
      | "VAT"
      | "CLEANING"
      | "MANAGEMENT_COMMISSION"
      | "TAX"
      | "OTHER";

    calculatedAmount: number;
  }[];
};

export function buildFinanceInsights({
  reports,
}: {
  reports: FinanceIntelligenceReportInput[];
}): IntelligenceInsight[] {
  const insights: IntelligenceInsight[] = [];

  const reportsByProperty =
    new Map<
      string,
      FinanceIntelligenceReportInput[]
    >();

  for (const report of reports) {
    const current =
      reportsByProperty.get(
        report.propertyId,
      ) ?? [];

    current.push(report);

    reportsByProperty.set(
      report.propertyId,
      current,
    );
  }

  for (
    const propertyReports
    of reportsByProperty.values()
  ) {
    propertyReports.sort(
      (left, right) =>
        right.referenceMonth.getTime() -
        left.referenceMonth.getTime(),
    );

    for (
      let index = 0;
      index < propertyReports.length;
      index += 1
    ) {
      const report =
        propertyReports[index];

      const previousReport =
        propertyReports[index + 1] ??
        null;

      const adjustmentTotal =
        report.adjustments.reduce(
          (total, adjustment) =>
            total +
            adjustment.amount,
          0,
        );

      const effectiveFinalAmount =
        report.finalAmount +
        adjustmentTotal;

      /*
       * 1. RETTIFICHE MANUALI RILEVANTI
       *
       * Segnaliamo solo quando la somma
       * delle rettifiche supera il 10%
       * del lordo del rendiconto.
       */
      if (
        report.grossRevenue > 0 &&
        Math.abs(
          adjustmentTotal,
        ) /
          report.grossRevenue >=
          0.1
      ) {
        const adjustmentPercent =
          (
            Math.abs(
              adjustmentTotal,
            ) /
            report.grossRevenue
          ) *
          100;

        insights.push({
          id:
            `finance-adjustment:${report.id}`,

          propertyId:
            report.propertyId,

          propertyName:
            report.propertyName,

          category:
            "FINANCE",

          severity:
            adjustmentPercent >= 20
              ? "WARNING"
              : "INFO",

          title:
            "Rettifiche rilevanti nel rendiconto",

          explanation:
            `Le rettifiche manuali incidono per circa ${adjustmentPercent.toFixed(
              0,
            )}% sul lordo del periodo.`,

          date:
            dateKey(
              report.referenceMonth,
            ),

          economicImpact: {
            amount:
              Math.abs(
                adjustmentTotal,
              ),

            currency: "EUR",

            direction:
              adjustmentTotal >= 0
                ? "POSITIVE"
                : "NEGATIVE",
          },

          action: {
            type:
              "REVIEW_FINANCE",

            label:
              "Verifica rendiconto",

            href:
              `/reports/monthly/${report.id}`,

            propertyId:
              report.propertyId,

            requiresApproval:
              false,
          },

          metadata: {
            reportId:
              report.id,

            adjustmentTotal,

            grossRevenue:
              report.grossRevenue,

            adjustmentPercent:
              Number(
                adjustmentPercent.toFixed(
                  2,
                ),
              ),
          },
        });
      }

      /*
       * 2. RAPPORTO NETTO / LORDO ANOMALO
       *
       * Soglia volutamente conservativa.
       * Evitiamo di segnalare normali
       * differenze dovute a commissioni
       * e costi operativi.
       */
      if (
        report.grossRevenue > 0
      ) {
        const netRatio =
          effectiveFinalAmount /
          report.grossRevenue;

        if (
          netRatio < 0.45 ||
          netRatio > 1.05
        ) {
          insights.push({
            id:
              `finance-net-ratio:${report.id}`,

            propertyId:
              report.propertyId,

            propertyName:
              report.propertyName,

            category:
              "FINANCE",

            severity:
              netRatio < 0.3 ||
              netRatio > 1.15
                ? "WARNING"
                : "INFO",

            title:
              "Rapporto netto/lordo da verificare",

            explanation:
              `Il risultato finale del rendiconto equivale a circa ${(netRatio * 100).toFixed(
                0,
              )}% del lordo del periodo.`,

            date:
              dateKey(
                report.referenceMonth,
              ),

            action: {
              type:
                "REVIEW_FINANCE",

              label:
                "Controlla calcolo",

              href:
                `/reports/monthly/${report.id}`,

              propertyId:
                report.propertyId,

              requiresApproval:
                false,
            },

            metadata: {
              reportId:
                report.id,

              grossRevenue:
                report.grossRevenue,

              effectiveFinalAmount,

              netRatioPercent:
                Number(
                  (
                    netRatio *
                    100
                  ).toFixed(
                    2,
                  ),
                ),
            },
          });
        }
      }

      /*
       * 3. COSTI FINANZIARI RILEVANTI
       *
       * Consideriamo solo le regole
       * SUBTRACT salvate nel rendiconto.
       *
       * L'insight compare solo quando
       * il peso complessivo supera il 35%
       * del lordo, per evitare rumore.
       */
      if (
        report.grossRevenue > 0
      ) {
        const costRules =
          report.rules.filter(
            (rule) =>
              rule.operation ===
              "SUBTRACT",
          );

        const totalRuleCosts =
          costRules.reduce(
            (total, rule) =>
              total +
              Math.abs(
                rule.calculatedAmount,
              ),
            0,
          );

        const costRatio =
          totalRuleCosts /
          report.grossRevenue;

        if (
          costRules.length > 0 &&
          costRatio >= 0.35
        ) {
          const dominantRule =
            costRules.reduce(
              (largest, current) =>
                Math.abs(
                  current.calculatedAmount,
                ) >
                Math.abs(
                  largest.calculatedAmount,
                )
                  ? current
                  : largest,
            );

          const costPercent =
            costRatio * 100;

          const dominantPercent =
            (
              Math.abs(
                dominantRule.calculatedAmount,
              ) /
              report.grossRevenue
            ) *
            100;

          insights.push({
            id:
              `finance-cost-weight:${report.id}`,

            propertyId:
              report.propertyId,

            propertyName:
              report.propertyName,

            category:
              "FINANCE",

            severity:
              costRatio >= 0.5
                ? "WARNING"
                : "INFO",

            title:
              "Costi rilevanti nel rendiconto",

            explanation:
              `Le regole di costo incidono per circa ${costPercent.toFixed(
                0,
              )}% sul lordo. La voce principale è "${dominantRule.ruleName}", pari a circa ${dominantPercent.toFixed(
                0,
              )}% del lordo.`,

            date:
              dateKey(
                report.referenceMonth,
              ),

            economicImpact: {
              amount:
                totalRuleCosts,

              currency:
                "EUR",

              direction:
                "NEGATIVE",
            },

            action: {
              type:
                "REVIEW_FINANCE",

              label:
                "Verifica costi",

              href:
                `/reports/monthly/${report.id}`,

              propertyId:
                report.propertyId,

              requiresApproval:
                false,
            },

            metadata: {
              reportId:
                report.id,

              totalRuleCosts,

              costPercent:
                Number(
                  costPercent.toFixed(
                    2,
                  ),
                ),

              dominantRule:
                dominantRule.ruleName,

              dominantCategory:
                dominantRule.category,

              dominantPercent:
                Number(
                  dominantPercent.toFixed(
                    2,
                  ),
                ),
            },
          });
        }
      }

      /*
       * 4. VARIAZIONE FORTE VS MESE PRECEDENTE
       *
       * Richiede un precedente rendiconto
       * della stessa struttura.
       */
      if (
        previousReport &&
        previousReport.grossRevenue > 0
      ) {
        const grossChange =
          (
            report.grossRevenue -
            previousReport.grossRevenue
          ) /
          previousReport.grossRevenue;

        if (
          Math.abs(
            grossChange,
          ) >= 0.35
        ) {
          const changePercent =
            grossChange *
            100;

          insights.push({
            id:
              `finance-gross-change:${report.id}`,

            propertyId:
              report.propertyId,

            propertyName:
              report.propertyName,

            category:
              "FINANCE",

            severity:
              grossChange <= -0.5
                ? "WARNING"
                : grossChange > 0
                  ? "OPPORTUNITY"
                  : "INFO",

            title:
              grossChange > 0
                ? "Ricavi in forte crescita"
                : "Ricavi in forte diminuzione",

            explanation:
              `Il lordo è ${grossChange > 0 ? "aumentato" : "diminuito"} di circa ${Math.abs(
                changePercent,
              ).toFixed(
                0,
              )}% rispetto al rendiconto precedente.`,

            date:
              dateKey(
                report.referenceMonth,
              ),

            economicImpact: {
              amount:
                Math.abs(
                  report.grossRevenue -
                    previousReport.grossRevenue,
                ),

              currency:
                "EUR",

              direction:
                grossChange > 0
                  ? "POSITIVE"
                  : "NEGATIVE",
            },

            action: {
              type:
                "REVIEW_FINANCE",

              label:
                "Analizza rendiconto",

              href:
                `/reports/monthly/${report.id}`,

              propertyId:
                report.propertyId,

              requiresApproval:
                false,
            },

            metadata: {
              reportId:
                report.id,

              previousReportId:
                previousReport.id,

              grossRevenue:
                report.grossRevenue,

              previousGrossRevenue:
                previousReport.grossRevenue,

              grossChangePercent:
                Number(
                  changePercent.toFixed(
                    2,
                  ),
                ),
            },
          });
        }
      }
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

function dateKey(
  date: Date,
) {
  return date
    .toISOString()
    .slice(
      0,
      10,
    );
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

