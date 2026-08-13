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

export function PropertyPerformanceStrip({
  currentMonthRevenue,
  occupancyRate,
  averageNightlyRate,
  futureBookingsCount,
  operationalAlertsCount,
}: PropertyPerformanceStripProps) {
  return (
    <section className="mb-5 grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:grid-cols-2 lg:grid-cols-5">
      <Metric
        icon={
          <Euro size={16} />
        }
        label="Ricavi mese"
        value={formatCurrency(
          currentMonthRevenue,
        )}
        detail="Mese corrente"
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
        alert={
          operationalAlertsCount >
          0
        }
      />
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  alert = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  alert?: boolean;
}) {
  return (
    <div className="min-w-0 border-b border-slate-200 px-4 py-4 last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
      <div className="flex items-center gap-2">
        <span
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            alert
              ? "bg-amber-50 text-amber-600"
              : "bg-slate-50 text-slate-500",
          ].join(" ")}
        >
          {icon}
        </span>

        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>
      </div>

      <p
        className={[
          "mt-3 text-2xl font-bold tracking-tight",
          alert
            ? "text-amber-700"
            : "text-slate-950",
        ].join(" ")}
      >
        {value}
      </p>

      <p
        className={[
          "mt-1 truncate text-xs",
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
