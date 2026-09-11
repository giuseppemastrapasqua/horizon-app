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
    <section className="mb-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#09131C]/90 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
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
      "bg-[#D8B367]/[0.08] text-[#D8B367] ring-[#D8B367]/20",
    sky:
      "bg-sky-400/[0.08] text-sky-300 ring-sky-400/20",
    emerald:
      "bg-emerald-400/[0.08] text-emerald-300 ring-emerald-400/20",
    indigo:
      "bg-indigo-400/[0.08] text-indigo-300 ring-indigo-400/20",
    amber:
      "bg-amber-400/[0.08] text-amber-300 ring-amber-400/20",
  };

  return (
    <div className="group relative min-w-0 border-b border-white/[0.06] px-4 py-4 transition-colors hover:bg-white/[0.025] last:border-b-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0">
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
              : "bg-white/[0.12]",
          ].join(" ")}
        />
      </div>

      <p className="mt-3 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#82909C]">
        {label}
      </p>

      <p
        className={[
          "mt-1 text-[22px] font-bold tracking-[-0.035em]",
          alert
            ? "text-amber-300"
            : "text-[#FFF8EA]",
        ].join(" ")}
      >
        {value}
      </p>

      <p
        className={[
          "mt-1 truncate text-[10px]",
          alert
            ? "font-medium text-amber-300"
            : "text-[#6F7E8A]",
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
