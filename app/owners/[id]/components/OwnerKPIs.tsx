import { MetricCard } from "@/components/ui/MetricCard";

type OwnerKPIsProps = {
  totalRevenue: number;
  currentMonthRevenue: number;
  propertiesCount: number;
  futureBookingsCount: number;
  currentBookingsCount: number;
  openTasksCount: number;
  operationalAlertsCount: number;
  documentsCount: number;
};

export function OwnerKPIs({
  totalRevenue,
  currentMonthRevenue,
  propertiesCount,
  futureBookingsCount,
  currentBookingsCount,
  openTasksCount,
  operationalAlertsCount,
  documentsCount,
}: OwnerKPIsProps) {
  return (
    <section style={gridStyle}>
      <MetricCard
        dark
        title="Ricavi complessivi"
        value={formatCurrency(totalRevenue)}
        subtitle="Storico delle prenotazioni registrate"
      />

      <MetricCard
        dark
        title="Ricavi mese"
        value={formatCurrency(currentMonthRevenue)}
        subtitle="Check-in nel mese corrente"
        tone="green"
      />

      <MetricCard
        dark
        title="Immobili"
        value={propertiesCount}
        subtitle="Unità collegate al proprietario"
      />

      <MetricCard
        dark
        title="Booking futuri"
        value={futureBookingsCount}
        subtitle="Arrivi ancora da gestire"
        tone="blue"
      />

      <MetricCard
        dark
        title="Soggiorni in corso"
        value={currentBookingsCount}
        subtitle="Ospiti attualmente presenti"
        tone="green"
      />

      <MetricCard
        dark
        title="Task aperti"
        value={openTasksCount}
        subtitle="Attività da completare"
        tone={openTasksCount > 0 ? "yellow" : "default"}
      />

      <MetricCard
        dark
        title="Criticità"
        value={operationalAlertsCount}
        subtitle="Prenotazioni che richiedono attenzione"
        tone={operationalAlertsCount > 0 ? "red" : "green"}
      />

      <MetricCard
        dark
        title="Documenti"
        value={documentsCount}
        subtitle="Report, rendiconti e fatture archiviate"
        tone="violet"
      />
    </section>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "24px",
};