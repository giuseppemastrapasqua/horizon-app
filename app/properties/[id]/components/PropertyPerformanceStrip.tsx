import {
  AlertTriangle,
  CalendarDays,
  CircleGauge,
  Euro,
  TrendingUp,
} from "lucide-react";

type PropertyPerformanceStripProps = {
  currentMonthRevenue: number;
  occupancyRate: number;
  averageNightlyRate: number;
  futureBookingsCount: number;
  operationalAlertsCount: number;
};

type MetricTone =
  | "blue"
  | "sky"
  | "emerald"
  | "indigo"
  | "amber";

export function PropertyPerformanceStrip({
  currentMonthRevenue,
  occupancyRate,
  averageNightlyRate,
  futureBookingsCount,
  operationalAlertsCount,
}: PropertyPerformanceStripProps) {
  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          icon={
            <Euro size={16} />
          }
          label="Ricavi mese"
          value={formatCurrency(
            currentMonthRevenue,
          )}
          detail="Mese corrente"
          tone="blue"
        />

        <Metric
          icon={
            <CircleGauge size={16} />
          }
          label="Occupazione"
          value={`${formatPercent(
            occupancyRate,
          )}%`}
          detail="Mese corrente"
          tone="sky"
        />

        <Metric
          icon={
            <TrendingUp size={16} />
          }
          label="ADR medio"
          value={formatCurrency(
            averageNightlyRate,
          )}
          detail="Ricavo medio per notte"
          tone="emerald"
        />

        <Metric
          icon={
            <CalendarDays size={16} />
          }
          label="Prenotazioni future"
          value={String(
            futureBookingsCount,
          )}
          detail="Arrivi da gestire"
          tone="indigo"
        />

        <Metric
          icon={
            <AlertTriangle size={16} />
          }
          label="Alert"
          value={String(
            operationalAlertsCount,
          )}
          detail={
            operationalAlertsCount === 0
              ? "Nessuna criticità"
              : "Richiedono attenzione"
          }
          tone={
            operationalAlertsCount > 0
              ? "amber"
              : "emerald"
          }
          alert={
            operationalAlertsCount >
            0
          }
        />
      </div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  tone,
  alert = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: MetricTone;
  alert?: boolean;
}) {
  const toneClasses: Record<
    MetricTone,
    string
  > = {
    blue:
      "bg-blue-50 text-blue-600 ring-blue-100",
    sky:
      "bg-sky-50 text-sky-600 ring-sky-100",
    emerald:
      "bg-emerald-50 text-emerald-600 ring-emerald-100",
    indigo:
      "bg-indigo-50 text-indigo-600 ring-indigo-100",
    amber:
      "bg-amber-50 text-amber-600 ring-amber-100",
  };

  return (
    <div className="group relative min-w-0 border-b border-slate-100 px-4 py-4 transition-colors hover:bg-slate-50/60 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div className="flex items-center justify-between gap-2">
        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-transform group-hover:-translate-y-0.5",
            toneClasses[tone],
          ].join(" ")}
        >
          {icon}
        </span>

        <span
          className={[
            "h-1.5 w-1.5 rounded-full",
            alert
              ? "bg-amber-400"
              : "bg-slate-200",
          ].join(" ")}
        />
      </div>

      <p className="mt-3 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p
        className={[
          "mt-1 text-[22px] font-bold tracking-[-0.035em]",
          alert
            ? "text-amber-700"
            : "text-slate-900",
        ].join(" ")}
      >
        {value}
      </p>

      <p
        className={[
          "mt-1 truncate text-[10px]",
          alert
            ? "font-medium text-amber-600"
            : "text-slate-400",
        ].join(" ")}
      >
        {detail}
      </p>
    </div>
  );
}

function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat(
    "it-IT",
    {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    },
  ).format(value);
}

function formatPercent(
  value: number,
) {
  return new Intl.NumberFormat(
    "it-IT",
    {
      maximumFractionDigits: 1,
    },
  ).format(value);
}
