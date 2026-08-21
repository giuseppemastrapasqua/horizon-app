import {
  notFound,
} from "next/navigation";

import {
  Pencil,
} from "lucide-react";

import {
  AppShell,
} from "@/components/AppShell";

import {
  Navigation,
} from "@/components/Navigation";

import {
  getPropertyWorkspace,
} from "@/lib/properties/get-property-workspace";

import {
  PropertyOverview,
} from "./components/PropertyOverview";

import {
  PropertyPerformanceStrip,
} from "./components/PropertyPerformanceStrip";

type PropertyDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const {
    id,
  } =
    await params;

  const workspace =
    await getPropertyWorkspace(
      id,
    );

  if (!workspace) {
    notFound();
  }

  const {
    property,
    metrics,
  } =
    workspace;

  return (
    <>
      <Navigation />

      <AppShell
        title={property.name}
        subtitle="Scheda struttura, stato operativo e indicatori principali."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-600">
              Struttura
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Informazioni principali e stato dell&apos;immobile.
            </p>
          </div>

          <a
            href={`/properties/${property.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-[10px] font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
          >
            <Pencil
              size={13}
            />

            Modifica struttura
          </a>
        </div>

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
            property.owner.fullName
          }
          currentScore={
            property.currentScore
          }
          commercialClass={
            property.commercialClass
          }
        />

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

        <section className="rounded-2xl border border-blue-100 bg-blue-50/40 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">
                Navigazione operativa
              </p>

              <p className="mt-1 text-[10px] leading-4 text-slate-500">
                Prenotazioni, calendario, task, documenti,
                fatture e rendiconti sono gestiti nelle
                rispettive sezioni Horizon.
              </p>
            </div>

            <span className="text-[9px] font-semibold text-blue-600">
              ID struttura: {property.id}
            </span>
          </div>
        </section>
      </AppShell>
    </>
  );
}

