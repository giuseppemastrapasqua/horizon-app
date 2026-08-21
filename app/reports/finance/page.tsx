import type { CSSProperties } from "react";

import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { buildFinanceInsights } from "@/lib/intelligence";
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

        adjustments: {
          orderBy: {
            createdAt: "asc",
          },

          select: {
            id: true,
            description: true,
            amount: true,
          },
        },

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

  const financeInsights =
    buildFinanceInsights({
      reports:
        reports.map(
          (report) => ({
            id: report.id,
            propertyId:
              report.property.id,
            propertyName:
              report.property.name,
            referenceMonth:
              report.referenceMonth,
            currency:
              report.currency,
            grossRevenue:
              Number(report.grossRevenue),
            finalAmount:
              Number(report.finalAmount),
            adjustments:
              report.adjustments.map(
                (adjustment) => ({
                  id: adjustment.id,
                  description:
                    adjustment.description,
                  amount:
                    Number(adjustment.amount),
                }),
              ),
          }),
        ),
    });

  const totalGrossRevenue =
    reports.reduce(
      (total, report) =>
        total +
        Number(report.grossRevenue),
      0
    );

  const totalManualAdjustments =
    reports.reduce(
      (total, report) => {
        const manualAdjustments =
          report.adjustments.reduce(
            (adjustmentTotal, adjustment) =>
              adjustmentTotal +
              Number(adjustment.amount),
            0
          );

        return (
          total +
          manualAdjustments
        );
      },
      0
    );

  const totalFinalAmount =
    reports.reduce(
      (total, report) => {
        const manualAdjustments =
          report.adjustments.reduce(
            (adjustmentTotal, adjustment) =>
              adjustmentTotal +
              Number(adjustment.amount),
            0
          );



      return (
        total +
        Number(report.finalAmount) +
        manualAdjustments
      );
    },
    0
  );

  const summaryCurrency = getSingleCurrency(
    reports.map((report) => report.currency)
  );

  const monthlyHistoryMap = new Map<
    string,
    {
      month: Date;
      grossRevenue: number;
      finalAmount: number;
      manualAdjustments: number;
      reportsCount: number;
    }
  >();

  for (const report of reports) {
    const key =
      `${report.referenceMonth.getUTCFullYear()}-${String(
        report.referenceMonth.getUTCMonth() + 1
      ).padStart(2, "0")}`;

    const manualAdjustments =
      report.adjustments.reduce(
        (total, adjustment) =>
          total +
          Number(adjustment.amount),
        0
      );

    const current =
      monthlyHistoryMap.get(key) ?? {
        month:
          report.referenceMonth,
        grossRevenue: 0,
        finalAmount: 0,
        manualAdjustments: 0,
        reportsCount: 0,
      };

    current.grossRevenue +=
      Number(report.grossRevenue);

    current.finalAmount +=
      Number(report.finalAmount) +
      manualAdjustments;

    current.manualAdjustments +=
      manualAdjustments;

    current.reportsCount += 1;

    monthlyHistoryMap.set(
      key,
      current
    );
  }

  const monthlyHistory =
    Array.from(
      monthlyHistoryMap.values()
    )
      .sort(
        (a, b) =>
          b.month.getTime() -
          a.month.getTime()
      )
      .slice(0, 12);

  const maxMonthlyGross =
    Math.max(
      1,
      ...monthlyHistory.map(
        (item) =>
          item.grossRevenue
      )
    );

  const propertyPerformanceMapForDashboard =
    new Map<
      string,
      {
        propertyId: string;
        propertyName: string;
        address: string;
        city: string;
        grossRevenue: number;
        finalAmount: number;
        manualAdjustments: number;
        reportsCount: number;
      }
    >();

  for (const report of reports) {
    const manualAdjustments =
      report.adjustments.reduce(
        (total, adjustment) =>
          total +
          Number(adjustment.amount),
        0
      );

    const current =
      propertyPerformanceMapForDashboard.get(
        report.property.id
      ) ?? {
        propertyId:
          report.property.id,

        propertyName:
          report.property.name,

        address:
          report.property.address,

        city:
          report.property.city,

        grossRevenue: 0,
        finalAmount: 0,
        manualAdjustments: 0,
        reportsCount: 0,
      };

    current.grossRevenue +=
      Number(report.grossRevenue);

    current.finalAmount +=
      Number(report.finalAmount) +
      manualAdjustments;

    current.manualAdjustments +=
      manualAdjustments;

    current.reportsCount += 1;

    propertyPerformanceMapForDashboard.set(
      report.property.id,
      current
    );
  }

  const propertyPerformance =
    Array.from(
      propertyPerformanceMapForDashboard.values()
    ).sort(
      (a, b) =>
        b.finalAmount -
        a.finalAmount
    );

  const maxPropertyGross =
    Math.max(
      1,
      ...propertyPerformance.map(
        (item) =>
          item.grossRevenue
      )
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

          <Link
  href="/reports/monthly/property"
  style={primaryLinkStyle}
>
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

        {financeInsights.length > 0 ? (
          <section className="mb-5 rounded-3xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">
                  HORIZON INTELLIGENCE
                </div>

                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                  Elementi finanziari da verificare
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Horizon evidenzia solo variazioni e anomalie economicamente rilevanti.
                </p>
              </div>

              <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                {financeInsights.length}{" "}
                {financeInsights.length === 1
                  ? "segnalazione"
                  : "segnalazioni"}
              </span>
            </div>

            <div className="grid gap-3">
              {financeInsights.map((insight) => {
                const severityClass =
                  insight.severity === "CRITICAL"
                    ? "border-rose-200 bg-rose-50"
                    : insight.severity === "WARNING"
                      ? "border-amber-200 bg-amber-50"
                      : insight.severity === "OPPORTUNITY"
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-blue-100 bg-white";

                const severityLabel =
                  insight.severity === "CRITICAL"
                    ? "Critico"
                    : insight.severity === "WARNING"
                      ? "Attenzione"
                      : insight.severity === "OPPORTUNITY"
                        ? "Opportunità"
                        : "Informazione";

                return (
                  <article
                    key={insight.id}
                    className={`rounded-2xl border p-5 ${severityClass}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
                            {severityLabel}
                          </span>

                          <span className="text-xs font-semibold text-slate-500">
                            {insight.propertyName}
                          </span>
                        </div>

                        <h3 className="mt-3 text-base font-bold text-slate-950">
                          {insight.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {insight.explanation}
                        </p>
                      </div>

                      {insight.action?.href ? (
                        <Link
                          href={insight.action.href}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-sm font-bold text-white no-underline transition hover:bg-blue-700"
                        >
                          {insight.action.label}
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                ANDAMENTO
              </div>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Storico mensile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Confronto tra lordo e netto proprietari negli ultimi 12 mesi disponibili.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              Ultimi {monthlyHistory.length}{" "}
              {monthlyHistory.length === 1
                ? "mese"
                : "mesi"}
            </span>
          </div>

          {monthlyHistory.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
              Nessun dato storico disponibile.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {monthlyHistory.map(
                (item) => {
                  const netRatio =
                    item.grossRevenue > 0
                      ? Math.max(
                          0,
                          Math.min(
                            100,
                            (
                              item.finalAmount /
                              item.grossRevenue
                            ) * 100
                          )
                        )
                      : 0;

                  return (
                    <article
                      key={
                        item.month.toISOString()
                      }
                      className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                            <span className="text-lg">
                              ◫
                            </span>
                          </div>

                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-[0.02em] text-slate-950">
                              {formatMonth(
                                item.month
                              )}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.reportsCount}{" "}
                              {item.reportsCount === 1
                                ? "rendiconto"
                                : "rendiconti"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-y-5 sm:grid-cols-4">
                        <div className="border-r border-slate-100 pr-4">
                          <div className="text-xs text-slate-500">
                            Lordo
                          </div>

                          <div className="mt-2 text-lg font-bold tabular-nums text-slate-950">
                            {summaryCurrency
                              ? formatCurrency(
                                  item.grossRevenue,
                                  summaryCurrency
                                )
                              : "—"}
                          </div>
                        </div>

                        <div className="border-r border-slate-100 px-4">
                          <div className="text-xs text-slate-500">
                            Netto proprietario
                          </div>

                          <div className="mt-2 text-lg font-bold tabular-nums text-emerald-600">
                            {summaryCurrency
                              ? formatCurrency(
                                  item.finalAmount,
                                  summaryCurrency
                                )
                              : "—"}
                          </div>
                        </div>

                        <div className="border-r border-slate-100 px-4">
                          <div className="text-xs text-slate-500">
                            Rettifiche
                          </div>

                          <div
                            className={
                              item.manualAdjustments === 0
                                ? "mt-2 text-lg font-bold tabular-nums text-slate-950"
                                : item.manualAdjustments < 0
                                  ? "mt-2 text-lg font-bold tabular-nums text-rose-600"
                                  : "mt-2 text-lg font-bold tabular-nums text-emerald-600"
                            }
                          >
                            {summaryCurrency
                              ? item.manualAdjustments === 0
                                ? formatCurrency(
                                    0,
                                    summaryCurrency
                                  )
                                : formatSignedCurrency(
                                    item.manualAdjustments,
                                    summaryCurrency
                                  )
                              : "—"}
                          </div>
                        </div>

                        <div className="pl-4">
                          <div className="text-xs text-slate-500">
                            Netto / Lordo
                          </div>

                          <div className="mt-2 text-lg font-bold tabular-nums text-blue-600">
                            {netRatio.toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width:
                              `${netRatio}%`,
                          }}
                        />
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="mb-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                PERFORMANCE STRUTTURE
              </div>

              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                Risultati per immobile
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Confronto tra lordo generato e netto proprietario nel periodo selezionato.
              </p>
            </div>

            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              {propertyPerformance.length}{" "}
              {propertyPerformance.length === 1
                ? "struttura"
                : "strutture"}
            </span>
          </div>

          {propertyPerformance.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
              Nessun dato disponibile.
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {propertyPerformance.map(
                (item, index) => {
                  const margin =
                    item.grossRevenue > 0
                      ? Math.max(
                          0,
                          Math.min(
                            100,
                            (
                              item.finalAmount /
                              item.grossRevenue
                            ) * 100
                          )
                        )
                      : 0;

                  return (
                    <article
                      key={item.propertyId}
                      className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-black text-blue-600">
                          #{index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/properties/${item.propertyId}`}
                            className="text-lg font-bold tracking-[-0.02em] text-slate-950 no-underline transition hover:text-blue-600"
                          >
                            {item.propertyName}
                          </Link>

                          <div className="mt-1 text-sm text-slate-500">
                            {item.address}, {item.city}
                          </div>

                          <div className="mt-1 text-xs text-slate-400">
                            {item.reportsCount}{" "}
                            {item.reportsCount === 1
                              ? "rendiconto"
                              : "rendiconti"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <div>
                          <div className="text-xs text-slate-500">
                            Lordo
                          </div>

                          <div className="mt-2 text-lg font-bold tabular-nums text-slate-950">
                            {summaryCurrency
                              ? formatCurrency(
                                  item.grossRevenue,
                                  summaryCurrency
                                )
                              : "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-500">
                            Netto proprietario
                          </div>

                          <div className="mt-2 text-lg font-bold tabular-nums text-emerald-600">
                            {summaryCurrency
                              ? formatCurrency(
                                  item.finalAmount,
                                  summaryCurrency
                                )
                              : "—"}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-slate-500">
                            Rettifiche
                          </div>

                          <div
                            className={
                              item.manualAdjustments === 0
                                ? "mt-2 text-lg font-bold tabular-nums text-slate-950"
                                : item.manualAdjustments < 0
                                  ? "mt-2 text-lg font-bold tabular-nums text-rose-600"
                                  : "mt-2 text-lg font-bold tabular-nums text-emerald-600"
                            }
                          >
                            {summaryCurrency
                              ? item.manualAdjustments === 0
                                ? formatCurrency(
                                    0,
                                    summaryCurrency
                                  )
                                : formatSignedCurrency(
                                    item.manualAdjustments,
                                    summaryCurrency
                                  )
                              : "—"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 rounded-2xl bg-emerald-50/70 p-4">
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <div className="text-xs font-semibold text-emerald-700">
                              Margine proprietario
                            </div>

                            <div className="mt-1 text-2xl font-black tabular-nums text-emerald-800">
                              {margin.toFixed(1).replace(
                                ".",
                                ","
                              )}%
                            </div>
                          </div>

                          <div className="text-xs text-emerald-700">
                            Netto / Lordo
                          </div>
                        </div>

                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-100">
                          <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{
                              width:
                                `${margin}%`,
                            }}
                          />
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
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



const actionSeparatorStyle: CSSProperties = {
  margin: "0 7px",
  color: "#94a3b8",
};

const pdfLinkStyle: CSSProperties = {
  color: "#475569",
  fontSize: "13px",
  fontWeight: 700,
  textDecoration: "none",
};

const historyPanelStyle: CSSProperties = {
  padding: "22px",
  marginBottom: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  background: "#ffffff",
};

const historyDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.5,
};

const historyListStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  background: "#e2e8f0",
};

const historyRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "170px minmax(320px, 1fr) 170px",
  alignItems: "center",
  gap: "24px",
  padding: "18px",
  background: "#ffffff",
};

const historyMonthStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  color: "#0f172a",
  fontSize: "14px",
};

const historyBarsStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const historyBarHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "5px",
  color: "#475569",
  fontSize: "11px",
};

const historyTrackStyle: CSSProperties = {
  width: "100%",
  height: "8px",
  overflow: "hidden",
  borderRadius: "999px",
  background: "#e2e8f0",
};

const grossBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "#2563eb",
};

const netBarStyle: CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "#16a34a",
};

const historyAdjustmentStyle: CSSProperties = {
  display: "grid",
  justifyItems: "end",
  gap: "5px",
  color: "#0f172a",
  fontSize: "13px",
};



const performancePanelStyle: CSSProperties = {
  padding: "22px",
  marginBottom: "20px",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  background: "#ffffff",
};

const performanceListStyle: CSSProperties = {
  display: "grid",
  gap: "2px",
  overflow: "hidden",
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  background: "#e2e8f0",
};

const performanceRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(230px, 0.8fr) minmax(340px, 1.5fr) 170px",
  alignItems: "center",
  gap: "24px",
  padding: "18px",
  background: "#ffffff",
};

const performancePropertyStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
};

const performanceRankStyle: CSSProperties = {
  display: "grid",
  placeItems: "center",
  width: "28px",
  height: "28px",
  flex: "0 0 28px",
  borderRadius: "9px",
  background: "#eff6ff",
  color: "#2563eb",
  fontSize: "12px",
  fontWeight: 800,
};

const performanceBarsStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const performanceNumbersStyle: CSSProperties = {
  display: "grid",
  justifyItems: "end",
  gap: "5px",
  color: "#0f172a",
  fontSize: "13px",
};


