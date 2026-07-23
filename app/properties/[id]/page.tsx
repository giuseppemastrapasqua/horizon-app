import { notFound } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";
import { WorkspaceGrid } from "@/components/ui/WorkspaceGrid";
import { WorkspaceTopBar } from "@/components/ui/WorkspaceTopBar";
import { getPropertyWorkspace } from "@/lib/properties/get-property-workspace";
import { PropertyHero } from "./components/PropertyHero";
import { PropertyKPIs } from "./components/PropertyKPIs";
import { PropertyBookings } from "./components/PropertyBookings";
import { PropertyTimeline } from "./components/PropertyTimeline";
import { PropertyDocuments } from "./components/PropertyDocuments";
import { PropertyQuickActions } from "./components/PropertyQuickActions";

type PropertyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } = await params;

  const workspace = await getPropertyWorkspace(id);

  if (!workspace) {
    notFound();
  }

  const {
    property,
    metrics,
    recentBookings,
    documents,
    timeline,
  } = workspace;

  return (
    <>
      <Navigation />

      <AppShell
        title={property.name}
        subtitle="Workspace immobile e controllo operativo completo."
      >
        <WorkspaceTopBar
          backLabel="Torna agli immobili"
          backHref="/properties"
          actions={
            <>
              <ActionButton
                label="Nuova prenotazione"
                href={`/bookings/new?propertyId=${property.id}`}
              />

              <ActionButton
                label="Rendiconto immobile"
                href={`/reports/monthly/property?propertyId=${property.id}`}
                variant="secondary"
              />

              <ActionButton
                label="Modifica immobile"
                href={`/properties/${property.id}/edit`}
                variant="secondary"
              />
            </>
          }
        />

        <PropertyHero
          property={property}
          futureBookingsCount={metrics.futureBookingsCount}
          currentBookingsCount={metrics.currentBookingsCount}
          openTasksCount={metrics.openTasksCount}
          operationalAlertsCount={metrics.operationalAlertsCount}
        />

        <PropertyKPIs
          totalRevenue={metrics.totalRevenue}
          currentMonthRevenue={metrics.currentMonthRevenue}
          bookingsCount={metrics.bookingsCount}
          futureBookingsCount={metrics.futureBookingsCount}
          currentBookingsCount={metrics.currentBookingsCount}
          openTasksCount={metrics.openTasksCount}
          operationalAlertsCount={metrics.operationalAlertsCount}
          occupancyRate={metrics.occupancyRate}
          averageBookingValue={metrics.averageBookingValue}
          averageNightlyRate={metrics.averageNightlyRate}
          documentsCount={metrics.documentsCount}
          soldNights={metrics.soldNights}
        />

        <WorkspaceGrid
          left={
            <>
              <PropertyBookings
                propertyId={property.id}
                bookings={recentBookings}
              />

              <PropertyDocuments
                propertyId={property.id}
                documents={documents}
              />
            </>
          }
          right={
            <>
              <PropertyTimeline items={timeline} />

              <PropertyQuickActions
                propertyId={property.id}
                ownerId={property.owner.id}
              />
            </>
          }
        />
      </AppShell>
    </>
  );
}