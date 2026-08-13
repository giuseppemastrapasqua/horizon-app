import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import {
  DashboardAlertPanel,
  DashboardAlertRow,
} from "@/components/dashboard/DashboardAlertPanel";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardLegacyKpis } from "@/components/dashboard/DashboardLegacyKpis";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { DashboardPortfolioPanel } from "@/components/dashboard/DashboardPortfolioPanel";
import { DashboardStatusPill } from "@/components/dashboard/DashboardStatusPill";
import { DashboardTodayBookings } from "@/components/dashboard/DashboardTodayBookings";
import { DashboardUpcomingBookings } from "@/components/dashboard/DashboardUpcomingBookings";
import { DashboardUrgentTasks } from "@/components/dashboard/DashboardUrgentTasks";
import { PriorityTasksPanel } from "@/components/dashboard/PriorityTasksPanel";
import { WorkspaceGrid } from "@/components/ui/WorkspaceGrid";
import { getDashboardPageData } from "@/lib/dashboard/get-dashboard-page-data";

export default async function Home() {
  const {
    properties,
    totalRevenue,
    activeProperties,
    openTasks,
    completedTasks,
    futureBookings,
    operationalAlerts,
    averageBookingRevenue,
    urgentTasks,
    nextCheckIns,
    nextCheckOuts,
    commandCenter,
  } = await getDashboardPageData();

  const {
    metrics,
    checkInsToday,
    checkOutsToday,
    priorityTasks,
    generatedAt,
  } = commandCenter;

  return (
    <AppShell
      title="Horizon Executive Dashboard"
      subtitle="Controllo operativo, portfolio e prossime azioni."
    >
      <DashboardHeader generatedAt={generatedAt} />

      <DashboardMetrics metrics={metrics} />

      <WorkspaceGrid
        left={
          <DashboardTodayBookings
            checkInsToday={checkInsToday}
            checkOutsToday={checkOutsToday}
          />
        }
        right={<PriorityTasksPanel tasks={priorityTasks} />}
      />

      <DashboardLegacyKpis
        totalRevenue={totalRevenue}
        activeProperties={activeProperties.length}
        futureBookings={futureBookings.length}
        operationalAlerts={operationalAlerts.length}
        openTasks={openTasks.length}
        completedTasks={completedTasks.length}
        averageBookingRevenue={averageBookingRevenue}
      />

      <DashboardUpcomingBookings
        nextCheckIns={nextCheckIns}
        nextCheckOuts={nextCheckOuts}
      />

      <section style={sectionBottomStyle}>
        <DashboardAlertPanel title="Attenzione operativa">
          {operationalAlerts.length === 0 ? (
            <DashboardEmptyState text="Nessuna criticità operativa aperta." />
          ) : (
            operationalAlerts.map((booking) => (
              <DashboardAlertRow key={booking.id}>
                <div>
                  <Link
                    href={`/bookings/${booking.id}`}
                    style={alertBookingLinkStyle}
                  >
                    {booking.guestName}
                  </Link>

                  <div style={alertBookingMetaStyle}>
                    {booking.property.name} ·{" "}
                    {booking.checkIn.toLocaleDateString("it-IT")} →{" "}
                    {booking.checkOut.toLocaleDateString("it-IT")}
                  </div>
                </div>

                <DashboardStatusPill
                  value={booking.operationalStatus}
                />
              </DashboardAlertRow>
            ))
          )}
        </DashboardAlertPanel>
      </section>

      <DashboardUrgentTasks urgentTasks={urgentTasks} />

      <DashboardPortfolioPanel properties={properties} />
    </AppShell>
  );
}

const sectionBottomStyle = {
  marginBottom: "32px",
};

const alertBookingLinkStyle = {
  color: "#9f1239",
  fontWeight: 900,
  textDecoration: "none",
};

const alertBookingMetaStyle = {
  marginTop: "4px",
  color: "#64748b",
};