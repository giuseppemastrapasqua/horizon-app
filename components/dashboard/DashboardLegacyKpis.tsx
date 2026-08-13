import { DashboardKpiLink } from "@/components/dashboard/DashboardKpiLink";
import { DashboardMiniKpi } from "@/components/dashboard/DashboardMiniKpi";

type DashboardLegacyKpisProps = {
  totalRevenue: number;
  activeProperties: number;
  futureBookings: number;
  operationalAlerts: number;
  openTasks: number;
  completedTasks: number;
  averageBookingRevenue: number;
};

export function DashboardLegacyKpis({
  totalRevenue,
  activeProperties,
  futureBookings,
  operationalAlerts,
  openTasks,
  completedTasks,
  averageBookingRevenue,
}: DashboardLegacyKpisProps) {
  return (
    <>
      <section style={kpiGridStyle}>
        <DashboardKpiLink
          href="/bookings"
          title="Ricavi demo"
          value={`${totalRevenue.toFixed(2)} €`}
          hint="Totale booking caricati"
        />

        <DashboardKpiLink
          href="/properties"
          title="Immobili attivi"
          value={activeProperties}
          hint="Portfolio operativo"
        />

        <DashboardKpiLink
          href="/bookings"
          title="Prenotazioni future"
          value={futureBookings}
          hint="Soggiorni in calendario"
        />

        <DashboardKpiLink
          href="/bookings"
          title="Alert operativi"
          value={operationalAlerts}
          hint="Booking da controllare"
        />
      </section>

      <section style={miniGridStyle}>
        <DashboardMiniKpi
          href="/tasks?status=open"
          title="Task aperti"
          value={openTasks}
        />

        <DashboardMiniKpi
          href="/tasks?status=done"
          title="Task completati"
          value={completedTasks}
          tone="green"
        />

        <DashboardMiniKpi
          href="/bookings"
          title="Booking con problemi"
          value={operationalAlerts}
          tone="red"
        />

        <DashboardMiniKpi
          href="/bookings"
          title="Ricavo medio booking"
          value={`${averageBookingRevenue.toFixed(0)} €`}
        />
      </section>
    </>
  );
}

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: "18px",
  marginTop: "32px",
  marginBottom: "18px",
};

const miniGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: "18px",
  marginBottom: "32px",
};