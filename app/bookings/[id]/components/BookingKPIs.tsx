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
      <MetricCard dark
        title="Valore prenotazione"
        value={formatCurrency(grossAmount, currency)}
        subtitle="Importo lordo registrato"
      />

      <MetricCard dark
        title="ADR"
        value={formatCurrency(nightlyRate, currency)}
        subtitle="Ricavo medio per notte"
      />

      <MetricCard dark
        title="Notti"
        value={nights}
        subtitle="Durata complessiva del soggiorno"
      />

      <MetricCard dark
        title="Ospiti"
        value={guests}
        subtitle="Numero di persone previste"
      />

      <MetricCard dark
        title="Task totali"
        value={totalTaskCount}
        subtitle="Attività collegate alla prenotazione"
      />

      <MetricCard dark
        title="Task aperti"
        value={openTasksCount}
        subtitle="Attività ancora da completare"
      />

      <MetricCard dark
        title="Task completati"
        value={completedTasksCount}
        subtitle="Attività concluse"
      />

      <MetricCard dark
        title="Task scaduti"
        value={overdueTasksCount}
        subtitle="Attività che richiedono attenzione"
      />

      <MetricCard dark
        title="Documenti"
        value={documentsCount}
        subtitle="Documenti collegati a owner o immobile"
      />

      <MetricCard dark
        title="Avanzamento soggiorno"
        value={formatPercentage(stayProgress)}
        subtitle="Percentuale del soggiorno completata"
      />

      <MetricCard dark
        title="Giorni al check-in"
        value={daysUntilCheckIn}
        subtitle={getCheckInSubtitle(daysUntilCheckIn)}
      />

      <MetricCard dark
        title="Giorni al check-out"
        value={daysUntilCheckOut}
        subtitle={getCheckOutSubtitle(daysUntilCheckOut)}
      />
    </section>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
} satisfies React.CSSProperties;

function getCheckInSubtitle(daysUntilCheckIn: number) {
  if (daysUntilCheckIn < 0) {
    return "Check-in già effettuato";
  }

  if (daysUntilCheckIn === 0) {
    return "Check-in oggi";
  }

  if (daysUntilCheckIn === 1) {
    return "Check-in domani";
  }

  return "Tempo restante prima dell'arrivo";
}

function getCheckOutSubtitle(daysUntilCheckOut: number) {
  if (daysUntilCheckOut < 0) {
    return "Check-out già effettuato";
  }

  if (daysUntilCheckOut === 0) {
    return "Check-out oggi";
  }

  if (daysUntilCheckOut === 1) {
    return "Check-out domani";
  }

  return "Tempo restante prima della partenza";
}