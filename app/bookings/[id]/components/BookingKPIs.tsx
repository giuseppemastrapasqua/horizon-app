import { MetricCard } from "@/components/ui/MetricCard";
import { formatCurrency } from "@/lib/format/currency";
import { formatPercentage } from "@/lib/format/percentage";

type BookingKPIsProps = {
  grossAmount: number;
  currency: string;
  nightlyRate: number;
  nights: number;
  guests: number;
  totalTaskCount: number;
  openTasksCount: number;
  completedTasksCount: number;
  overdueTasksCount: number;
  documentsCount: number;
  stayProgress: number;
  daysUntilCheckIn: number;
  daysUntilCheckOut: number;
};

export function BookingKPIs({
  grossAmount,
  currency,
  nightlyRate,
  nights,
  guests,
  totalTaskCount,
  openTasksCount,
  completedTasksCount,
  overdueTasksCount,
  documentsCount,
  stayProgress,
  daysUntilCheckIn,
  daysUntilCheckOut,
}: BookingKPIsProps) {
  return (
    <section style={gridStyle}>
      <MetricCard
        title="Valore prenotazione"
        value={formatCurrency(grossAmount, currency)}
        subtitle="Importo lordo registrato"
        tone="green"
      />

      <MetricCard
        title="ADR"
        value={formatCurrency(nightlyRate, currency)}
        subtitle="Ricavo medio per notte"
        tone="blue"
      />

      <MetricCard
        title="Notti"
        value={nights}
        subtitle="Durata complessiva del soggiorno"
      />

      <MetricCard
        title="Ospiti"
        value={guests}
        subtitle="Numero di persone previste"
        tone="violet"
      />

      <MetricCard
        title="Task totali"
        value={totalTaskCount}
        subtitle="Attività collegate alla prenotazione"
      />

      <MetricCard
        title="Task aperti"
        value={openTasksCount}
        subtitle="Attività ancora da completare"
        tone={openTasksCount > 0 ? "yellow" : "green"}
      />

      <MetricCard
        title="Task completati"
        value={completedTasksCount}
        subtitle="Attività concluse"
        tone="green"
      />

      <MetricCard
        title="Task scaduti"
        value={overdueTasksCount}
        subtitle="Attività che richiedono attenzione"
        tone={overdueTasksCount > 0 ? "red" : "green"}
      />

      <MetricCard
        title="Documenti"
        value={documentsCount}
        subtitle="Documenti collegati a owner o immobile"
        tone="violet"
      />

      <MetricCard
        title="Avanzamento soggiorno"
        value={formatPercentage(stayProgress)}
        subtitle="Percentuale del soggiorno completata"
        tone={
          stayProgress >= 100
            ? "green"
            : stayProgress > 0
              ? "blue"
              : "default"
        }
      />

      <MetricCard
        title="Giorni al check-in"
        value={daysUntilCheckIn}
        subtitle={getCheckInSubtitle(daysUntilCheckIn)}
        tone={
          daysUntilCheckIn < 0
            ? "default"
            : daysUntilCheckIn <= 1
              ? "yellow"
              : "blue"
        }
      />

      <MetricCard
        title="Giorni al check-out"
        value={daysUntilCheckOut}
        subtitle={getCheckOutSubtitle(daysUntilCheckOut)}
        tone={
          daysUntilCheckOut < 0
            ? "default"
            : daysUntilCheckOut <= 1
              ? "yellow"
              : "blue"
        }
      />
    </section>
  );
}

function getCheckInSubtitle(days: number) {
  if (days < 0) return "Check-in già avvenuto";
  if (days === 0) return "Check-in previsto oggi";
  if (days === 1) return "Check-in previsto domani";

  return "Tempo residuo prima dell’arrivo";
}

function getCheckOutSubtitle(days: number) {
  if (days < 0) return "Check-out già avvenuto";
  if (days === 0) return "Check-out previsto oggi";
  if (days === 1) return "Check-out previsto domani";

  return "Tempo residuo prima della partenza";
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};