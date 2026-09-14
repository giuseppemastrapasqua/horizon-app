import {
  PropertyPerformanceChart,
} from "./components/PropertyPerformanceChart";

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
  requireUser,
} from "@/lib/auth/guards";

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
  const user = await requireUser();

  if (user.role === "OPERATOR") {
    throw new Error("Accesso non autorizzato.");
  }
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
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#D8B367]">
              Struttura
            </p>

            <p className="mt-1 text-[10px] text-slate-500">
              Informazioni principali e stato dell&apos;immobile.
            </p>
          </div>

          <a
            href={`/properties/${property.id}/edit`}
            className="inline-flex items-center gap-2 rounded-xl border border-[#D8B367] bg-[#D8B367] px-3.5 py-2 text-[10px] font-semibold !text-[#07111A] transition hover:border-[#E4C47E] hover:bg-[#E4C47E]"
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

        <PropertyPerformanceChart
          bookings={workspace.calendarBookings}
        />

        <section className="rounded-2xl border border-white/[0.07] bg-[#09131C]/90 px-5 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#D8B367]">
                Navigazione operativa
              </p>

              <p className="mt-1 text-[10px] leading-4 text-[#82909C]">
                Prenotazioni, calendario, task, documenti,
                fatture e rendiconti sono gestiti nelle
                rispettive sezioni Horizon.
              </p>
            </div>

            <span className="text-[9px] font-semibold text-[#6F7E8A]">
              ID struttura: {property.id}
            </span>
          </div>
        </section>
      </AppShell>
    </>
  );
}
