import {
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import {
  formatMoney,
} from "./formatters";

import type {
  CalendarMetrics,
} from "./types";

type CalendarMetricsPanelProps = {
  metrics: CalendarMetrics;
  previousYearMetrics: CalendarMetrics;
  estimatedCleaningCost: number;
};

export function CalendarMetricsPanel({
  metrics,
  previousYearMetrics,
  estimatedCleaningCost,
}: CalendarMetricsPanelProps) {
  return (
    <div className="border-t border-slate-200 bg-white p-3">
      <div className="grid gap-2.5 md:grid-cols-3">
        <CurrentMonthCard
          metrics={metrics}
        />

        <ComparisonCard
          title="Vs stesso mese anno precedente"
          current={metrics}
          previous={previousYearMetrics}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Costi del mese
          </p>

          <div className="mt-2.5 space-y-2">
            <CostRow
              label="Pulizie"
              value={formatMoney(
                estimatedCleaningCost,
                metrics.currency,
              )}
            />

            <CostRow
              label="Commissioni PM"
              value="Da configurare"
              muted
            />

            <CostRow
              label="Commissioni OTA"
              value="Da configurare"
              muted
            />

            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold text-slate-700">
                  Totale costi
                </span>

                <span className="text-[11px] font-bold text-slate-950">
                  {formatMoney(
                    estimatedCleaningCost,
                    metrics.currency,
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentMonthCard({
  metrics,
}: {
  metrics: CalendarMetrics;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        Mese corrente
      </p>

      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2">
        <div>
          <p className="text-[9px] text-slate-400">
            Notti prenotate
          </p>

          <p className="mt-0.5 text-sm font-bold text-slate-950">
            {metrics.occupiedNights}
          </p>
        </div>

        <div>
          <p className="text-[9px] text-slate-400">
            Occupazione
          </p>

          <p className="mt-0.5 text-sm font-bold text-slate-950">
            {metrics.occupancyRate}%
          </p>
        </div>

        <div>
          <p className="text-[9px] text-slate-400">
            Prenotazioni
          </p>

          <p className="mt-0.5 text-sm font-bold text-slate-950">
            {metrics.bookingsCount}
          </p>
        </div>

        <div>
          <p className="text-[9px] text-slate-400">
            Incasso totale
          </p>

          <p className="mt-0.5 text-sm font-bold text-slate-950">
            {formatMoney(
              metrics.grossRevenue,
              metrics.currency,
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({
  title,
  current,
  previous,
}: {
  title: string;
  current: CalendarMetrics;
  previous: CalendarMetrics;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>

      <div className="mt-2.5 space-y-2">
        <ComparisonRow
          label="Occupazione"
          current={current.occupancyRate}
          previous={previous.occupancyRate}
          suffix="%"
        />

        <ComparisonRow
          label="Notti"
          current={current.occupiedNights}
          previous={previous.occupiedNights}
        />

        <ComparisonRow
          label="Prenotazioni"
          current={current.bookingsCount}
          previous={previous.bookingsCount}
        />

        <ComparisonRow
          label="Incasso"
          current={current.grossRevenue}
          previous={previous.grossRevenue}
          currency={current.currency}
        />
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  current,
  previous,
  suffix,
  currency,
}: {
  label: string;
  current: number;
  previous: number;
  suffix?: string;
  currency?: string;
}) {
  const delta =
    previous === 0
      ? current === 0
        ? 0
        : 100
      : Math.round(
          (
            (current - previous) /
            Math.abs(previous)
          ) * 100,
        );

  const positive =
    delta >= 0;

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-slate-500">
        {label}
      </span>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-900">
          {currency
            ? formatMoney(
                current,
                currency,
              )
            : `${current}${suffix ?? ""}`}
        </span>

        <span
          className={[
            "inline-flex items-center gap-0.5 text-[9px] font-semibold",
            positive
              ? "text-emerald-600"
              : "text-rose-600",
          ].join(" ")}
        >
          {positive ? (
            <TrendingUp size={10} />
          ) : (
            <TrendingDown size={10} />
          )}

          {Math.abs(delta)}%
        </span>
      </div>
    </div>
  );
}

function CostRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-slate-500">
        {label}
      </span>

      <span
        className={[
          "text-[11px] font-semibold",
          muted
            ? "text-slate-400"
            : "text-slate-900",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}
