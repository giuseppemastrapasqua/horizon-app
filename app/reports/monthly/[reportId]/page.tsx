import type { CSSProperties } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { prisma } from "@/lib/prisma";

type FinanceReportDetailPageProps = {
  params: Promise<{
    reportId: string;
  }>;
};

export default async function FinanceReportDetailPage({
  params,
}: FinanceReportDetailPageProps) {
  const resolvedParams = await params;

  const reportId =
    resolvedParams.reportId.trim();

  if (!reportId) {
    notFound();
  }

  const report =
    await prisma.financeReport.findUnique({
      where: {
        id: reportId,
      },

      select: {
        id: true,
        title: true,
        referenceMonth: true,
        currency: true,
        grossRevenue: true,
        finalAmount: true,
        formulaName: true,
        formulaSnapshot: true,
        createdAt: true,
        updatedAt: true,

        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            zone: true,
          },
        },

        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },

        formula: {
          select: {
            id: true,
            name: true,
            scope: true,
            status: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },

        rules: {
          orderBy: {
            order: "asc",
          },

          select: {
            id: true,
            sourceRuleId: true,
            order: true,
            ruleName: true,
            operation: true,
            valueType: true,
            baseAmount: true,
            configuredValue: true,
            calculatedAmount: true,
            totalBefore: true,
            totalAfter: true,
          },
        },
      },
    });

  if (!report) {
    notFound();
  }

  const grossRevenue =
    Number(report.grossRevenue);

  const finalAmount =
    Number(report.finalAmount);

  const difference =
    finalAmount - grossRevenue;

  const formulaSnapshot =
    parseFormulaSnapshot(
      report.formulaSnapshot
    );

  return (
    <>
      <Navigation />

      <AppShell
        title={report.title}
        subtitle={`Rendiconto salvato · ${formatMonth(
          report.referenceMonth
        )}`}
      >
        <section style={topBarStyle}>
          <div style={topBarLinksStyle}>
            <Link
              href="/reports/finance"
              style={secondaryLinkStyle}
            >
              Torna all’archivio
            </Link>

            <Link
              href={`/properties/${report.property.id}`}
              style={secondaryLinkStyle}
            >
              Apri immobile
            </Link>

            <Link
              href={`/reports/monthly/${report.id}/pdf`}
              style={primaryLinkStyle}
            >
              Scarica PDF
            </Link>
          </div>

          <span style={savedBadgeStyle}>
            Rendiconto salvato
          </span>
        </section>

        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>
              RENDICONTO FINANZIARIO
            </div>

            <h2 style={heroTitleStyle}>
              {report.property.name}
            </h2>

            <p style={heroSubtitleStyle}>
              {report.property.address},{" "}
              {report.property.zone
                ? `${report.property.zone}, `
                : ""}
              {report.property.city}
            </p>
          </div>

          <div style={heroMetaStyle}>
            <div style={heroMetaItemStyle}>
              <span style={metaLabelStyle}>
                Mese
              </span>

              <strong style={metaValueStyle}>
                {formatMonth(
                  report.referenceMonth
                )}
              </strong>
            </div>

            <div style={heroMetaItemStyle}>
              <span style={metaLabelStyle}>
                Formula
              </span>

              <strong style={metaValueStyle}>
                {report.formulaName}
              </strong>
            </div>
          </div>
        </section>

        <section style={metricsGridStyle}>
          <Metric
            label="Ricavo lordo"
            value={formatCurrency(
              grossRevenue,
              report.currency
            )}
          />

          <Metric
            label="Risultato finale"
            value={formatCurrency(
              finalAmount,
              report.currency
            )}
            tone="positive"
          />

          <Metric
            label="Differenza"
            value={formatSignedCurrency(
              difference,
              report.currency
            )}
            tone={
              difference >= 0
                ? "positive"
                : "negative"
            }
          />

          <Metric
            label="Regole applicate"
            value={report.rules.length}
          />
        </section>

        <section style={detailsGridStyle}>
          <article style={detailCardStyle}>
            <div style={sectionEyebrowStyle}>
              PROPRIETARIO
            </div>

            <h3 style={cardTitleStyle}>
              {report.owner.fullName}
            </h3>

            <div style={detailListStyle}>
              <DetailRow
                label="Email"
                value={
                  report.owner.email ??
                  "Non disponibile"
                }
              />

              <DetailRow
                label="Telefono"
                value={
                  report.owner.phone ??
                  "Non disponibile"
                }
              />
            </div>
          </article>

          <article style={detailCardStyle}>
            <div style={sectionEyebrowStyle}>
              CREAZIONE
            </div>

            <h3 style={cardTitleStyle}>
              Informazioni documento
            </h3>

            <div style={detailListStyle}>
              <DetailRow
                label="Creato il"
                value={formatDateTime(
                  report.createdAt
                )}
              />

              <DetailRow
                label="Aggiornato il"
                value={formatDateTime(
                  report.updatedAt
                )}
              />

              <DetailRow
                label="Creato da"
                value={
                  report.createdBy
                    ?.fullName ??
                  "Sistema"
                }
              />
            </div>
          </article>

          <article style={detailCardStyle}>
            <div style={sectionEyebrowStyle}>
              FORMULA
            </div>

            <h3 style={cardTitleStyle}>
              {report.formulaName}
            </h3>

            <div style={detailListStyle}>
              <DetailRow
                label="Formula originale"
                value={
                  report.formula
                    ? "Disponibile"
                    : "Non più disponibile"
                }
              />

              <DetailRow
                label="Scope"
                value={
                  formulaSnapshot?.scope
                    ? formatScope(
                        formulaSnapshot.scope
                      )
                    : report.formula
                      ? formatScope(
                          report.formula.scope
                        )
                      : "Non disponibile"
                }
              />

              <DetailRow
                label="Stato al salvataggio"
                value={
                  formulaSnapshot?.status ??
                  "Non disponibile"
                }
              />
            </div>
          </article>
        </section>

        <section style={calculationPanelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionEyebrowStyle}>
                CALCOLO SALVATO
              </div>

              <h3 style={sectionTitleStyle}>
                Dettaglio delle regole
              </h3>
            </div>

            <span style={countBadgeStyle}>
              {report.rules.length}
            </span>
          </div>

          <div style={calculationSummaryStyle}>
            <div>
              <div style={calculationLabelStyle}>
                Importo iniziale
              </div>

              <strong style={grossAmountStyle}>
                {formatCurrency(
                  grossRevenue,
                  report.currency
                )}
              </strong>
            </div>

            <div style={calculationArrowStyle}>
              →
            </div>

            <div style={finalSummaryStyle}>
              <div style={calculationLabelStyle}>
                Importo finale
              </div>

              <strong style={finalSummaryAmountStyle}>
                {formatCurrency(
                  finalAmount,
                  report.currency
                )}
              </strong>
            </div>
          </div>

          {report.rules.length === 0 ? (
            <div style={emptyStateStyle}>
              Il rendiconto non contiene regole
              applicate. Il risultato finale
              coincide con il ricavo lordo.
            </div>
          ) : (
            <div style={rulesListStyle}>
              {report.rules.map((rule) => {
                const calculatedAmount =
                  Number(
                    rule.calculatedAmount
                  );

                const signedAmount =
                  rule.operation === "ADD"
                    ? calculatedAmount
                    : -calculatedAmount;

                return (
                  <article
                    key={rule.id}
                    style={ruleCardStyle}
                  >
                    <div style={ruleOrderStyle}>
                      {rule.order}
                    </div>

                    <div style={ruleContentStyle}>
                      <div style={ruleTitleRowStyle}>
                        <strong
                          style={ruleTitleStyle}
                        >
                          {rule.ruleName}
                        </strong>

                        <span
                          style={
                            rule.operation ===
                            "ADD"
                              ? addBadgeStyle
                              : subtractBadgeStyle
                          }
                        >
                          {rule.operation ===
                          "ADD"
                            ? "Aggiunta"
                            : "Sottrazione"}
                        </span>
                      </div>

                      <div style={ruleMetaStyle}>
                        Base:{" "}
                        {formatCurrency(
                          Number(
                            rule.baseAmount
                          ),
                          report.currency
                        )}
                        {" · "}
                        Valore:{" "}
                        {formatConfiguredValue({
                          valueType:
                            rule.valueType,
                          value: Number(
                            rule.configuredValue
                          ),
                          currency:
                            report.currency,
                        })}
                      </div>

                      <div
                        style={
                          ruleTotalsStyle
                        }
                      >
                        <span>
                          Prima:{" "}
                          {formatCurrency(
                            Number(
                              rule.totalBefore
                            ),
                            report.currency
                          )}
                        </span>

                        <span>
                          Dopo:{" "}
                          {formatCurrency(
                            Number(
                              rule.totalAfter
                            ),
                            report.currency
                          )}
                        </span>
                      </div>
                    </div>

                    <div
                      style={
                        ruleAmountColumnStyle
                      }
                    >
                      <strong
                        style={
                          signedAmount >= 0
                            ? positiveAmountStyle
                            : negativeAmountStyle
                        }
                      >
                        {formatSignedCurrency(
                          signedAmount,
                          report.currency
                        )}
                      </strong>

                      <span
                        style={
                          runningTotalStyle
                        }
                      >
                        Totale{" "}
                        {formatCurrency(
                          Number(
                            rule.totalAfter
                          ),
                          report.currency
                        )}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section style={snapshotPanelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionEyebrowStyle}>
                SNAPSHOT STORICO
              </div>

              <h3 style={sectionTitleStyle}>
                Formula usata al momento della
                generazione
              </h3>
            </div>

            <span style={snapshotBadgeStyle}>
              Immutabile
            </span>
          </div>

          {formulaSnapshot ? (
            <div style={snapshotGridStyle}>
              <DetailRow
                label="Nome"
                value={formulaSnapshot.name}
              />

              <DetailRow
                label="Descrizione"
                value={
                  formulaSnapshot.description ??
                  "Nessuna descrizione"
                }
              />

              <DetailRow
                label="Scope"
                value={formatScope(
                  formulaSnapshot.scope
                )}
              />

              <DetailRow
                label="Stato"
                value={formulaSnapshot.status}
              />

              <DetailRow
                label="Regole nello snapshot"
                value={
                  formulaSnapshot.rules.length
                }
              />
            </div>
          ) : (
            <div style={emptyStateStyle}>
              Lo snapshot della formula non può
              essere interpretato.
            </div>
          )}
        </section>
      </AppShell>
    </>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "positive" | "negative";
}) {
  const valueStyle =
    tone === "positive"
      ? metricPositiveValueStyle
      : tone === "negative"
        ? metricNegativeValueStyle
        : metricValueStyle;

  return (
    <article style={metricStyle}>
      <div style={metricLabelStyle}>
        {label}
      </div>

      <strong style={valueStyle}>
        {value}
      </strong>
    </article>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={detailRowStyle}>
      <span style={detailLabelStyle}>
        {label}
      </span>

      <strong style={detailValueStyle}>
        {value}
      </strong>
    </div>
  );
}

type FormulaSnapshot = {
  id: string;
  name: string;
  description?: string | null;
  scope: string;
  status: string;
  propertyId?: string | null;
  rules: Array<{
    id: string;
    name: string;
    description?: string | null;
    order: number;
    isEnabled: boolean;
    operation: string;
    valueType: string;
    base: string;
    value: number;
    referencedFormulaId?: string | null;
  }>;
};

function parseFormulaSnapshot(
  value: unknown
): FormulaSnapshot | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const snapshot =
    value as Record<string, unknown>;

  if (
    typeof snapshot.id !== "string" ||
    typeof snapshot.name !== "string" ||
    typeof snapshot.scope !== "string" ||
    typeof snapshot.status !== "string" ||
    !Array.isArray(snapshot.rules)
  ) {
    return null;
  }

  return {
    id: snapshot.id,
    name: snapshot.name,
    description:
      typeof snapshot.description ===
        "string" ||
      snapshot.description === null
        ? snapshot.description
        : null,
    scope: snapshot.scope,
    status: snapshot.status,
    propertyId:
      typeof snapshot.propertyId ===
        "string" ||
      snapshot.propertyId === null
        ? snapshot.propertyId
        : null,
    rules: snapshot.rules.filter(
      isFormulaSnapshotRule
    ),
  };
}

function isFormulaSnapshotRule(
  value: unknown
): value is FormulaSnapshot["rules"][number] {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const rule =
    value as Record<string, unknown>;

  return (
    typeof rule.id === "string" &&
    typeof rule.name === "string" &&
    typeof rule.order === "number" &&
    typeof rule.isEnabled === "boolean" &&
    typeof rule.operation === "string" &&
    typeof rule.valueType === "string" &&
    typeof rule.base === "string" &&
    typeof rule.value === "number"
  );
}

function formatConfiguredValue({
  valueType,
  value,
  currency,
}: {
  valueType: string;
  value: number;
  currency: string;
}) {
  if (valueType === "PERCENTAGE") {
    return `${value}%`;
  }

  if (valueType === "FORMULA") {
    return "Formula collegata";
  }

  return formatCurrency(
    value,
    currency
  );
}

function formatCurrency(
  value: number,
  currency: string
) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(value);
}

function formatSignedCurrency(
  value: number,
  currency: string
) {
  const formattedValue =
    formatCurrency(
      Math.abs(value),
      currency
    );

  if (value > 0) {
    return `+ ${formattedValue}`;
  }

  if (value < 0) {
    return `- ${formattedValue}`;
  }

  return formattedValue;
}

function formatMonth(date: Date) {
  const formattedMonth =
    new Intl.DateTimeFormat("it-IT", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);

  return capitalizeFirstLetter(
    formattedMonth
  );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat(
    "it-IT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function formatScope(scope: string) {
  if (scope === "SINGLE_PROPERTY") {
    return "Singolo immobile";
  }

  if (scope === "ALL_PROPERTIES") {
    return "Tutti gli immobili";
  }

  return scope;
}

function capitalizeFirstLetter(
  value: string
) {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

const topBarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const topBarLinksStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "40px",
  padding: "0 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#334155",
  fontWeight: 700,
  textDecoration: "none",
};

const primaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "40px",
  padding: "0 14px",
  border: "1px solid #1d4ed8",
  borderRadius: "10px",
  background: "#1d4ed8",
  color: "#ffffff",
  fontWeight: 700,
  textDecoration: "none",
};

const savedBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "36px",
  padding: "0 12px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: "12px",
  fontWeight: 800,
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "24px",
  padding: "24px",
  marginBottom: "20px",
  border: "1px solid #bfdbfe",
  borderRadius: "20px",
  background: "#eff6ff",
  flexWrap: "wrap",
};

const eyebrowStyle: CSSProperties = {
  color: "#1d4ed8",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const heroTitleStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#0f172a",
  fontSize: "30px",
};

const heroSubtitleStyle: CSSProperties = {
  margin: "8px 0 0",
  color: "#475569",
};

const heroMetaStyle: CSSProperties = {
  display: "grid",
  minWidth: "260px",
  gap: "12px",
};

const heroMetaItemStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
};

const metaLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 700,
};

const metaValueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "15px",
};

const metricsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "16px",
  marginBottom: "20px",
};

const metricStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
  padding: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  background: "#ffffff",
};

const metricLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 700,
};

const metricValueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "24px",
};

const metricPositiveValueStyle: CSSProperties = {
  ...metricValueStyle,
  color: "#166534",
};

const metricNegativeValueStyle: CSSProperties = {
  ...metricValueStyle,
  color: "#be123c",
};

const detailsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
  marginBottom: "20px",
};

const detailCardStyle: CSSProperties = {
  padding: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  background: "#ffffff",
};

const sectionEyebrowStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const cardTitleStyle: CSSProperties = {
  margin: "6px 0 16px",
  color: "#0f172a",
  fontSize: "19px",
};

const detailListStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const detailRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
  paddingBottom: "10px",
  borderBottom: "1px solid #f1f5f9",
};

const detailLabelStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "13px",
};

const detailValueStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "13px",
  textAlign: "right",
};

const calculationPanelStyle: CSSProperties = {
  padding: "22px",
  marginBottom: "20px",
  border: "1px solid #d1fae5",
  borderRadius: "20px",
  background: "#ffffff",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "18px",
};

const sectionTitleStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#0f172a",
  fontSize: "22px",
};

const countBadgeStyle: CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  minWidth: "36px",
  padding: "7px 11px",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#334155",
  fontWeight: 800,
};

const calculationSummaryStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(180px, 1fr) auto minmax(180px, 1fr)",
  alignItems: "center",
  gap: "20px",
  padding: "20px",
  marginBottom: "18px",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  background: "#f8fafc",
};

const calculationLabelStyle: CSSProperties = {
  marginBottom: "6px",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 700,
};

const grossAmountStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "24px",
};

const calculationArrowStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "24px",
  fontWeight: 800,
};

const finalSummaryStyle: CSSProperties = {
  textAlign: "right",
};

const finalSummaryAmountStyle: CSSProperties = {
  color: "#166534",
  fontSize: "28px",
};

const rulesListStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const ruleCardStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "40px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "14px",
  padding: "15px",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  background: "#f8fafc",
};

const ruleOrderStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  background: "#e2e8f0",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 800,
};

const ruleContentStyle: CSSProperties = {
  minWidth: 0,
};

const ruleTitleRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const ruleTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "15px",
};

const addBadgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: "10px",
  fontWeight: 800,
};

const subtractBadgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "4px 7px",
  borderRadius: "999px",
  background: "#ffe4e6",
  color: "#be123c",
  fontSize: "10px",
  fontWeight: 800,
};

const ruleMetaStyle: CSSProperties = {
  marginTop: "6px",
  color: "#64748b",
  fontSize: "12px",
};

const ruleTotalsStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  marginTop: "6px",
  color: "#94a3b8",
  fontSize: "11px",
  flexWrap: "wrap",
};

const ruleAmountColumnStyle: CSSProperties = {
  display: "grid",
  justifyItems: "end",
  gap: "4px",
  textAlign: "right",
};

const positiveAmountStyle: CSSProperties = {
  color: "#166534",
  fontSize: "15px",
};

const negativeAmountStyle: CSSProperties = {
  color: "#be123c",
  fontSize: "15px",
};

const runningTotalStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
  whiteSpace: "nowrap",
};

const snapshotPanelStyle: CSSProperties = {
  padding: "22px",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  background: "#ffffff",
};

const snapshotBadgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "#fef3c7",
  color: "#92400e",
  fontSize: "12px",
  fontWeight: 800,
};

const snapshotGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(230px, 1fr))",
  gap: "14px 24px",
};

const emptyStateStyle: CSSProperties = {
  padding: "28px",
  borderRadius: "14px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
};