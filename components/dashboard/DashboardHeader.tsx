import { ActionButton } from "@/components/ui/ActionButton";
import { formatDateTime } from "@/lib/format/date";

type DashboardHeaderProps = {
  generatedAt: Date;
};

export function DashboardHeader({
  generatedAt,
}: DashboardHeaderProps) {
  return (
    <section className="mb-6 flex flex-wrap items-start justify-between gap-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm">
      <div>
        <div className="text-xs font-semibold tracking-[0.08em] text-slate-500">
          HORIZON COMMAND CENTER
        </div>

        <h2 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Controllo operativo di oggi
        </h2>

        <p className="mt-2 text-slate-500">
          Ultimo aggiornamento: {formatDateTime(generatedAt)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton
          label="Nuova prenotazione"
          href="/bookings/new"
        />

        <ActionButton
          label="IMPERIUM Monitor"
          href="/imperium"
          variant="secondary"
        />
      </div>
    </section>
  );
}