import { MetricCard } from "@/components/ui/MetricCard";
import { formatCurrency } from "@/lib/format/currency";
import { formatPercentage } from "@/lib/format/percentage";

type PropertyKPIsProps = {
  totalRevenue: number;
  currentMonthRevenue: number;
  bookingsCount: number;
  futureBookingsCount: number;
  currentBookingsCount: number;
  openTasksCount: number;
  operationalAlertsCount: number;
  occupancyRate: number;
  averageBookingValue: number;
  averageNightlyRate: number;
  documentsCount: number;
  soldNights: number;
};

export function PropertyKPIs({
  totalRevenue,
  currentMonthRevenue,
  bookingsCount,
  futureBookingsCount,
  currentBookingsCount,
  openTasksCount,
  operationalAlertsCount,
  occupancyRate,
  averageBookingValue,
  averageNightlyRate,
  documentsCount,
  soldNights,
}: PropertyKPIsProps) {
  return (
    <section style={gridStyle}>
      <MetricCard
        title="Ricavi complessivi"
        value={formatCurrency(totalRevenue)}
        subtitle="Storico delle prenotazioni registrate"
      />

      <MetricCard
        title="Ricavi mese"
        value={formatCurrency(currentMonthRevenue)}
        subtitle="Check-in nel mese corrente"
        tone="green"
      />

      <MetricCard
        title="Occupazione mese"
        value={formatPercentage(occupancyRate)}
        subtitle={`${soldNights} notti vendute`}
        tone={occupancyRate >= 70 ? "green" : occupancyRate >= 45 ? "yellow" : "red"}
      />

      <MetricCard
        title="ADR medio"
        value={formatCurrency(averageNightlyRate)}
        subtitle="Ricavo medio per notte"
        tone="blue"
      />

      <MetricCard
        title="Booking totali"
        value={bookingsCount}
        subtitle="Prenotazioni registrate"
      />

      <MetricCard
        title="Booking futuri"
        value={futureBookingsCount}
        subtitle="Arrivi ancora da gestire"
        tone="blue"
      />

      <MetricCard
        title="Soggiorni in corso"
        value={currentBookingsCount}
        subtitle="Ospiti attualmente presenti"
        tone={currentBookingsCount > 0 ? "green" : "default"}
      />

      <MetricCard
        title="Valore medio booking"
        value={formatCurrency(averageBookingValue)}
        subtitle="Importo medio per prenotazione"
      />

      <MetricCard
        title="Task aperti"
        value={openTasksCount}
        subtitle="Attività ancora da completare"
        tone={openTasksCount > 0 ? "yellow" : "green"}
      />

      <MetricCard
        title="Criticità operative"
        value={operationalAlertsCount}
        subtitle="Prenotazioni che richiedono attenzione"
        tone={operationalAlertsCount > 0 ? "red" : "green"}
      />

      <MetricCard
        title="Documenti"
        value={documentsCount}
        subtitle="Report e rendiconti disponibili"
        tone="violet"
      />

      <MetricCard
        title="Notti vendute"
        value={soldNights}
        subtitle="Periodo mensile corrente"
      />
    </section>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};