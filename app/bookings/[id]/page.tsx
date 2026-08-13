import { notFound } from "next/navigation";

import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { ActionButton } from "@/components/ui/ActionButton";

import { getBookingWorkspace } from "@/lib/bookings/get-booking-workspace";

import { BookingHero } from "./components/BookingHero";
import { BookingKPIs } from "./components/BookingKPIs";
import { BookingTasks } from "./components/BookingTasks";
import { BookingTimeline } from "./components/BookingTimeline";
import { BookingDocuments } from "./components/BookingDocuments";
import { BookingQuickActions } from "./components/BookingQuickActions";
import { WorkspaceGrid } from "@/components/ui/WorkspaceGrid";
import { WorkspaceTopBar } from "@/components/ui/WorkspaceTopBar";

type BookingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BookingPage({
  params,
}: BookingPageProps) {
  const { id } = await params;

  const workspace = await getBookingWorkspace(id);

  if (!workspace) {
    notFound();
  }

  const {
    booking,
    metrics,
    tasks,
    documents,
    timeline,
  } = workspace;

  return (
    <>
      <Navigation />

      <AppShell
        title={booking.guestName}
        subtitle="Workspace operativo della prenotazione."
      >
       <WorkspaceTopBar
  backLabel="Torna alle prenotazioni"
  backHref="/bookings"
  actions={
    <>
      <ActionButton
        label="Apri immobile"
        href={`/properties/${booking.property.id}`}
      />

      <ActionButton
        label="Owner workspace"
        href={`/owners/${booking.owner.id}`}
        variant="secondary"
      />
    </>
  }
/>

        <BookingHero
          booking={booking}
          openTasksCount={metrics.openTasksCount}
          overdueTasksCount={metrics.overdueTasksCount}
          daysUntilCheckIn={metrics.daysUntilCheckIn}
          stayProgress={metrics.stayProgress}
        />

        <BookingKPIs
          grossAmount={booking.grossAmount}
          currency={booking.currency}
          nightlyRate={metrics.nightlyRate}
          nights={booking.nights}
          guests={booking.guests}
          totalTaskCount={metrics.totalTaskCount}
          openTasksCount={metrics.openTasksCount}
          completedTasksCount={metrics.completedTasksCount}
          overdueTasksCount={metrics.overdueTasksCount}
          documentsCount={metrics.documentsCount}
          stayProgress={metrics.stayProgress}
          daysUntilCheckIn={metrics.daysUntilCheckIn}
          daysUntilCheckOut={metrics.daysUntilCheckOut}
        />

        <WorkspaceGrid
  left={
    <>
      <BookingTasks
        bookingId={booking.id}
        propertyId={booking.property.id}
        tasks={tasks}
      />

      <BookingDocuments
        propertyId={booking.property.id}
        documents={documents}
      />
    </>
  }
  right={
    <>
      <BookingTimeline items={timeline} />

      <BookingQuickActions
        bookingId={booking.id}
        propertyId={booking.property.id}
        ownerId={booking.owner.id}
      />
    </>
  }
/>
      </AppShell>
    </>
  );
}
