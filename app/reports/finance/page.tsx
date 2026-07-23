import type { CSSProperties } from "react";

import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { prisma } from "@/lib/prisma";

type FinanceReportsPageProps = {
  searchParams: Promise<{
    propertyId?: string | string[];
  }>;
};

export default async function FinanceReportsPage({
  searchParams,
}: FinanceReportsPageProps) {
  const resolvedSearchParams = await searchParams;

  const propertyIdValue = resolvedSearchParams.propertyId;

  const selectedPropertyId =
    typeof propertyIdValue === "string"
      ? propertyIdValue.trim()
      : "";

  const [properties, reports] = await Promise.all([
    prisma.property.findMany({
      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
      },
    }),

    prisma.financeReport.findMany({
      where: selectedPropertyId
        ? {
            propertyId: selectedPropertyId,
          }
        : undefined,

      orderBy: [
        {
          referenceMonth: "desc",
        },
        {
          createdAt: "desc",
        },
      ],

      take: 100,

      select: {
        id: true,
        title: true,
        referenceMonth: true,
        currency: true,
        grossRevenue: true,
        finalAmount: true,
        formulaName: true,
        createdAt: true,

        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },

        owner: {
          select: {
            id: true,
            fullName: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            fullName: true,
          },
        },

        _count: {
          select: {
            rules: true,
          },
        },
      },
    }),
  ]);

  const totalGrossRevenue = reports.reduce(
    (total, report) => total + Number(report.grossRevenue),
    0
  );

  const totalFinalAmount = reports.reduce(
    (total, report) => total + Number(report.finalAmount),
    0
  );

  const summaryCurrency = getSingleCurrency(
    reports.map((report) => report.currency)
  );

  return (
    <>
      <Navigation />

      <AppShell
        title="Archivio rendiconti"
        subtitle="Consulta i rendiconti finanziari salvati e il relativo storico."
      >
        <section style={toolbarStyle}>
          <form method="get" style={filterFormStyle}>
            <label htmlFor="propertyId" style={filterLabelStyle}>
              Immobile
            </label>

            <select
              id="propertyId"
              name="propertyId"
              defaultValue={selectedPropertyId}
              style={selectStyle}
            >
              <option value="">Tutti gli immobili</option>

              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>

            <button type="submit" style={filterButtonStyle}>
              Applica filtro
            </button>

            {selectedPropertyId ? (
              <Link href="/reports/finance" style={resetLinkStyle}>
                Rimuovi filtro
              </Link>
            ) : null}
          </form>

          <Link href="/properties" style={primaryLinkStyle}>
            Genera rendiconto
          </Link>
        </section>

        <section style={metricsGridStyle}>
          <Metric label="Rendiconti" value={reports.length} />

          <Metric
            label="Totale lordo"
            value={
              summaryCurrency
                ? formatCurrency(totalGrossRevenue, summaryCurrency)
                : "Valute multiple"
            }
          />

          <Metric
            label="Totale finale"
            value={
              summaryCurrency
                ? formatCurrency(totalFinalAmount, summaryCurrency)
                : "Valute multiple"
            }
          />

          <Metric
            label="Differenza"
            value={
              summaryCurrency
                ? formatSignedCurrency(
                    totalFinalAmount - totalGrossRevenue,
                    summaryCurrency
                  )
                : "Valute multiple"
            }
          />
        </section>

        <section style={archivePanelStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <div style={sectionEyebrowStyle}>STORICO</div>

              <h2 style={sectionTitleStyle}>
                Rendiconti salvati
              </h2>
            </div>

            <span style={countBadgeStyle}>{reports.length}</span>
          </div>

          {reports.length === 0 ? (
            <div style={emptyStateStyle}>
              <h3 style={emptyTitleStyle}>
                Nessun rendiconto trovato
              </h3>

              <p style={emptyDescriptionStyle}>
                Non sono ancora stati generati rendiconti per i
                criteri selezionati.
              </p>

              <Link href="/properties" style={primaryLinkStyle}>
                Seleziona un immobile
              </Link>
            </div>
          ) : (
            <div style={tableWrapperStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Mese</th>

                    <th style={tableHeaderStyle}>Immobile</th>

                    <th style={tableHeaderStyle}>Proprietario</th>

                    <th style={tableHeaderStyle}>Formula</th>

                    <th style={tableHeaderAmountStyle}>Lordo</th>

                    <th style={tableHeaderAmountStyle}>
                      Risultato
                    </th>

                    <th style={tableHeaderStyle}>Regole</th>

                    <th style={tableHeaderStyle}>Creato</th>

                    <th style={tableHeaderActionStyle}>
                      Azioni
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((report) => {
                    const grossRevenue = Number(
                      report.grossRevenue
                    );

                    const finalAmount = Number(
                      report.finalAmount
                    );

                    return (
                      <tr key={report.id}>
                        <td style={tableCellStyle}>
                          <strong style={monthStyle}>
                            {formatMonth(report.referenceMonth)}
                          </strong>
                        </td>

                        <td style={tableCellStyle}>
                          <Link
                            href={`/properties/${report.property.id}`}
                            style={propertyLinkStyle}
                          >
                            {report.property.name}
                          </Link>

                          <div style={secondaryTextStyle}>
                            {report.property.address},{" "}
                            {report.property.city}
                          </div>
                        </td>

                        <td style={tableCellStyle}>
                          {report.owner.fullName}
                        </td>

                        <td style={tableCellStyle}>
                          <span style={formulaBadgeStyle}>
                            {report.formulaName}
                          </span>
                        </td>

                        <td style={tableAmountCellStyle}>
                          {formatCurrency(
                            grossRevenue,
                            report.currency
                          )}
                        </td>

                        <td style={tableAmountCellStyle}>
                          <strong style={finalAmountStyle}>
                            {formatCurrency(
                              finalAmount,
                              report.currency
                            )}
                          </strong>

                          <div style={differenceStyle}>
                            {formatSignedCurrency(
                              finalAmount - grossRevenue,
                              report.currency
                            )}
                          </div>
                        </td>

                        <td style={tableCellStyle}>
                          <span style={rulesBadgeStyle}>
                            {report._count.rules}
                          </span>
                        </td>

                        <td style={tableCellStyle}>
                          <div>{formatDate(report.createdAt)}</div>

                          {report.createdBy ? (
                            <div style={secondaryTextStyle}>
                              da {report.createdBy.fullName}
                            </div>
                          ) : null}
                        </td>

                        <td style={tableActionCellStyle}>
                          <Link
                            href={`/reports/monthly/${report.id}`}
                            style={openLinkStyle}
                          >
                            Apri
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
}: {
  label: string;
  value: string | number;
}) {
  return (
    <article style={metricStyle}>
      <div style={metricLabelStyle}>{label}</div>

      <strong style={metricValueStyle}>{value}</strong>
    </article>
  );
}

function getSingleCurrency(currencies: string[]) {
  const uniqueCurrencies = Array.from(new Set(currencies));

  if (uniqueCurrencies.length === 0) {
    return "EUR";
  }

  if (uniqueCurrencies.length === 1) {
    return uniqueCurrencies[0];
  }

  return null;
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(value);
}

function formatSignedCurrency(
  value: number,
  currency: string
) {
  const formattedValue = formatCurrency(
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
  const formattedMonth = new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  return (
    formattedMonth.charAt(0).toUpperCase() +
    formattedMonth.slice(1)
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

const toolbarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: "18px",
  padding: "20px",
  marginBottom: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  background: "#ffffff",
  flexWrap: "wrap",
};

const filterFormStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: "10px",
  flexWrap: "wrap",
};

const filterLabelStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
};

const selectStyle: CSSProperties = {
  minWidth: "240px",
  minHeight: "42px",
  padding: "0 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#0f172a",
};

const filterButtonStyle: CSSProperties = {
  minHeight: "42px",
  padding: "0 16px",
  border: 0,
  borderRadius: "10px",
  background: "#0f172a",
  color: "#ffffff",
  fontWeight: 700,
  cursor: "pointer",
};

const resetLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "42px",
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
  textDecoration: "none",
};

const primaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "42px",
  padding: "0 16px",
  borderRadius: "10px",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 700,
  textDecoration: "none",
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

const archivePanelStyle: CSSProperties = {
  padding: "22px",
  border: "1px solid #e2e8f0",
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

const sectionEyebrowStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const sectionTitleStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#0f172a",
  fontSize: "22px",
};

const countBadgeStyle: CSSProperties = {
  minWidth: "36px",
  padding: "7px 11px",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#334155",
  textAlign: "center",
  fontWeight: 800,
};

const tableWrapperStyle: CSSProperties = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: "1100px",
  borderCollapse: "collapse",
};

const tableHeaderStyle: CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #cbd5e1",
  color: "#64748b",
  fontSize: "12px",
  fontWeight: 800,
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tableHeaderAmountStyle: CSSProperties = {
  ...tableHeaderStyle,
  textAlign: "right",
};

const tableHeaderActionStyle: CSSProperties = {
  ...tableHeaderStyle,
  textAlign: "right",
};

const tableCellStyle: CSSProperties = {
  padding: "15px 12px",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: "14px",
  verticalAlign: "middle",
};

const tableAmountCellStyle: CSSProperties = {
  ...tableCellStyle,
  textAlign: "right",
  whiteSpace: "nowrap",
};

const tableActionCellStyle: CSSProperties = {
  ...tableCellStyle,
  textAlign: "right",
};

const monthStyle: CSSProperties = {
  color: "#0f172a",
  whiteSpace: "nowrap",
};

const propertyLinkStyle: CSSProperties = {
  color: "#0f172a",
  fontWeight: 800,
  textDecoration: "none",
};

const secondaryTextStyle: CSSProperties = {
  marginTop: "4px",
  color: "#94a3b8",
  fontSize: "12px",
};

const formulaBadgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const rulesBadgeStyle: CSSProperties = {
  display: "inline-flex",
  minWidth: "30px",
  justifyContent: "center",
  padding: "6px 9px",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#475569",
  fontSize: "12px",
  fontWeight: 800,
};

const finalAmountStyle: CSSProperties = {
  color: "#166534",
};

const differenceStyle: CSSProperties = {
  marginTop: "4px",
  color: "#be123c",
  fontSize: "12px",
};

const openLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "36px",
  padding: "0 13px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 700,
  textDecoration: "none",
};

const emptyStateStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "12px",
  padding: "44px 24px",
  borderRadius: "16px",
  background: "#f8fafc",
  textAlign: "center",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
};

const emptyDescriptionStyle: CSSProperties = {
  maxWidth: "480px",
  margin: 0,
  color: "#64748b",
};