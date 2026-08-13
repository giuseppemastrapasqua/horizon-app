import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { WorkspaceGrid } from "@/components/ui/WorkspaceGrid";
import { WorkspaceTopBar } from "@/components/ui/WorkspaceTopBar";
import { getPropertyAvailabilityBlocks } from "@/lib/properties/get-property-availability-blocks";
import { getPropertyPricingOverrides } from "@/lib/properties/get-property-pricing-overrides";
import { getPropertyWorkspace } from "@/lib/properties/get-property-workspace";
import { getPropertyRevenueData } from "@/lib/revenue/get-property-revenue-data";

import {
  closePropertyPeriodAction,
  openPropertyPeriodAction,
} from "./availability-actions";
import { PropertyBookings } from "./components/PropertyBookings";
import { PropertyCalendar } from "./components/PropertyCalendar";
import { PropertyDocuments } from "./components/PropertyDocuments";
import { PropertyOverview } from "./components/PropertyOverview";
import { PropertyPerformanceStrip } from "./components/PropertyPerformanceStrip";
import { PropertyQuickActions } from "./components/PropertyQuickActions";
import { PropertyTimeline } from "./components/PropertyTimeline";
import { savePropertyPricingOverrideAction } from "./pricing-actions";

type PropertyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id } =
    await params;

  const workspace =
    await getPropertyWorkspace(
      id,
    );

  if (!workspace) {
    notFound();
  }

  const revenueStartDate =
    new Date();

  revenueStartDate.setUTCHours(
    0,
    0,
    0,
    0,
  );

  const revenueEndDate =
    new Date(
      revenueStartDate,
    );

  revenueEndDate.setUTCFullYear(
    revenueEndDate.getUTCFullYear() +
      1,
  );

  const [
    priceOverrides,
    availabilityBlocks,
    revenueData,
  ] =
    await Promise.all([
      getPropertyPricingOverrides(
        id,
      ),

      getPropertyAvailabilityBlocks(
        id,
      ),

      getPropertyRevenueData({
        propertyId:
          id,

        startDate:
          revenueStartDate,

        endDate:
          revenueEndDate,
      }),
    ]);

  const {
    property,
    cleaningCost,
    metrics,
    recentBookings,
    calendarBookings,
    propertyDocuments,
    timeline,
  } = workspace;

  return (
    <>
      <Navigation />

      <AppShell
        title={property.name}
        subtitle="Controllo operativo, performance e Revenue in un unico workspace."
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
                label="Rendiconto"
                href={`/reports/monthly/property?propertyId=${property.id}`}
                variant="secondary"
              />

              <ActionButton
                label="Modifica"
                href={`/properties/${property.id}/edit`}
                variant="secondary"
              />
            </>
          }
        />

        <div className="space-y-6">
          <section>
            <PropertyOverview
              address={
                property.address
              }
              zone={
                property.zone
              }
              status={
                property.status
              }
              maxGuests={
                property.maxGuests
              }
              bedrooms={
                property.bedrooms
              }
              bathrooms={
                property.bathrooms
              }
              ownerName={
                property.owner
                  .fullName
              }
              currentScore={
                property.currentScore
              }
              commercialClass={
                property.commercialClass
              }
            />
          </section>

          <section>
            <PropertyPerformanceStrip
              currentMonthRevenue={
                metrics.currentMonthRevenue
              }
              occupancyRate={
                metrics.occupancyRate
              }
              averageNightlyRate={
                metrics.averageNightlyRate
              }
              futureBookingsCount={
                metrics.futureBookingsCount
              }
              operationalAlertsCount={
                metrics.operationalAlertsCount
              }
            />
          </section>

          <section className="pt-2">
            <div className="mb-4 flex flex-col gap-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Centro operativo
              </p>

              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950">
                    Calendario e Revenue
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Disponibilità, prenotazioni, tariffe e raccomandazioni Horizon.
                  </p>
                </div>
              </div>
            </div>

            <PropertyCalendar
              propertyId={
                property.id
              }
              propertyName={
                property.name
              }
              bookings={
                calendarBookings
              }
              cleaningCost={
                cleaningCost
              }
              priceOverrides={
                priceOverrides
              }
              availabilityBlocks={
                availabilityBlocks
              }
              revenueData={
                revenueData
              }
              savePricingAction={
                savePropertyPricingOverrideAction
              }
              closePropertyAction={
                closePropertyPeriodAction
              }
              openPropertyAction={
                openPropertyPeriodAction
              }
            />
          </section>

          <section className="pt-4">
            <SectionHeading
              eyebrow="Operatività"
              title="Attività dell'immobile"
              description="Prenotazioni recenti, attività e interventi che richiedono attenzione."
            />

            <WorkspaceGrid
              left={
                <PropertyBookings
                  propertyId={
                    property.id
                  }
                  bookings={
                    recentBookings
                  }
                />
              }
              right={
                <PropertyTimeline
                  items={
                    timeline
                  }
                />
              }
            />
          </section>

          <section className="pt-4">
            <SectionHeading
              eyebrow="Gestione"
              title="Documenti e azioni"
              description="Accesso rapido alle informazioni amministrative e alle operazioni sulla struttura."
            />

            <WorkspaceGrid
              left={
                <PropertyDocuments
                  propertyId={
                    property.id
                  }
                  documents={
                    propertyDocuments
                  }
                />
              }
              right={
                <PropertyQuickActions
                  propertyId={
                    property.id
                  }
                  ownerId={
                    property.owner.id
                  }
                />
              }
            />
          </section>
        </div>
      </AppShell>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
        {eyebrow}
      </p>

      <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>

      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
