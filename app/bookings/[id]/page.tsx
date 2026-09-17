import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WorkspaceGrid } from "@/components/ui/WorkspaceGrid";
import { WorkspaceTopBar } from "@/components/ui/WorkspaceTopBar";
import { requireUser } from "@/lib/auth/guards";
import { getBookingWorkspace } from "@/lib/bookings/get-booking-workspace";
import { getOperatorBookingWorkspace } from "@/lib/bookings/get-operator-booking-workspace";
import { formatDate } from "@/lib/format/date";

import { BookingDocuments } from "./components/BookingDocuments";
import { BookingEditForm } from "./components/BookingEditForm";
import { BookingGuestCheckInPanel } from "./components/BookingGuestCheckInPanel";
import { BookingHero } from "./components/BookingHero";
import { BookingKPIs } from "./components/BookingKPIs";
import { BookingQuickActions } from "./components/BookingQuickActions";
import { BookingSoggiorniamoPanel } from "./components/BookingSoggiorniamoPanel";
import { BookingTasks } from "./components/BookingTasks";
import { BookingTimeline } from "./components/BookingTimeline";

type BookingPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BookingPage({
  params,
}: BookingPageProps) {
  const { id } = await params;
  const user = await requireUser();

  if (user.role === "OPERATOR") {
    const workspace = await getOperatorBookingWorkspace(id);

    if (!workspace) {
      notFound();
    }

    const { booking, metrics, tasks } = workspace;

    return (
      <>
        <Navigation />

        <AppShell
          title={booking.guestName}
          subtitle="Dettaglio operativo della prenotazione."
        >
          <WorkspaceTopBar
            backLabel="Torna alle prenotazioni"
            backHref="/bookings"
          />

          <Panel>
            <div
              style={{
                display: "grid",
                gap: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      opacity: 0.65,
                    }}
                  >
                    PRENOTAZIONE
                  </div>

                  <h1 style={{ margin: "6px 0 4px" }}>
                    {booking.guestName}
                  </h1>

                  <div style={{ opacity: 0.7 }}>
                    {booking.property.name} Ã‚Â·{" "}
                    {booking.property.zone ?? booking.property.city}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                  }}
                >
                  <StatusBadge label={booking.bookingStatus} />
                  <StatusBadge label={booking.operationalStatus} />
                  <StatusBadge
                    label={booking.channel}
                    tone="blue"
                    compact
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 12,
                }}
              >
                <OperationalDetail
                  label="Check-in"
                  value={formatDate(booking.checkIn)}
                />
                <OperationalDetail
                  label="Check-out"
                  value={formatDate(booking.checkOut)}
                />
                <OperationalDetail
                  label="Permanenza"
                  value={`${booking.nights} notti`}
                />
                <OperationalDetail
                  label="Ospiti"
                  value={String(booking.guests)}
                />
                <OperationalDetail
                  label="Telefono ospite"
                  value={booking.guestPhone ?? "Non indicato"}
                />
                <OperationalDetail
                  label="Email ospite"
                  value={booking.guestEmail ?? "Non indicata"}
                />
              </div>

              {booking.externalBookingId ? (
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  Riferimento canale: {booking.externalBookingId}
                </div>
              ) : null}

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <StatusBadge
                  label={`${metrics.openTasksCount} task aperti`}
                  tone={metrics.openTasksCount > 0 ? "yellow" : "green"}
                  compact
                />

                <StatusBadge
                  label={
                    metrics.overdueTasksCount > 0
                      ? `${metrics.overdueTasksCount} task scaduti`
                      : "Nessun task scaduto"
                  }
                  tone={metrics.overdueTasksCount > 0 ? "red" : "green"}
                  compact
                />
              </div>
            </div>
          </Panel>

          <WorkspaceGrid
            left={
              <Panel>
                <SectionTitle
                  title="Task prenotazione"
                  subtitle="AttivitÃƒÂ  operative collegate al soggiorno."
                />

                {tasks.length === 0 ? (
                  <p style={{ margin: 0, opacity: 0.7 }}>
                    Nessun task operativo collegato.
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 12 }}>
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        style={{
                          padding: 14,
                          border: "1px solid rgba(127,127,127,0.22)",
                          borderRadius: 12,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            flexWrap: "wrap",
                          }}
                        >
                          <strong>{task.title}</strong>

                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <StatusBadge
                              label={task.type}
                              tone="blue"
                              compact
                            />
                            <StatusBadge
                              label={task.status}
                              compact
                            />
                          </div>
                        </div>

                        {task.description ? (
                          <p style={{ margin: "8px 0 0", opacity: 0.7 }}>
                            {task.description}
                          </p>
                        ) : null}

                        {task.dueDate ? (
                          <p style={{ margin: "8px 0 0", opacity: 0.7 }}>
                            Scadenza: {formatDate(task.dueDate)}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            }
            right={
              <BookingGuestCheckInPanel
                bookingId={booking.id}
                guestEmail={booking.guestEmail}
                guestRegistration={booking.guestRegistration}
                initialLink={booking.guestCheckInLink}
                canSubmitToAlloggiati={false}
              />
            }
          />
        </AppShell>
      </>
    );
  }

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
        <div className="booking-workspace-clean">
          <style>{`
            .booking-workspace-clean [style*="border: 1px solid rgba(255"],
            .booking-workspace-clean [style*="border:1px solid rgba(255"],
            .booking-workspace-clean [style*="border: 1px solid rgb(255"],
            .booking-workspace-clean [style*="border:1px solid rgb(255"],
            .booking-workspace-clean [style*="border: 1px solid #fff"],
            .booking-workspace-clean [style*="border:1px solid #fff"],
            .booking-workspace-clean [style*="border: 1px solid white"],
            .booking-workspace-clean [style*="border:1px solid white"] {
              border-color: transparent !important;
            }

            .booking-workspace-clean fieldset {
              border-color: transparent !important;
            }

            .booking-workspace-clean details {
              border-color: transparent !important;
            }
            /* MOBILE_WRITE_TEST */

            /* HORIZON_MOBILE_SECTION_SPACING_FINAL */
            @media (max-width: 768px) {
              .booking-layout {
                display: flex !important;
                flex-direction: column !important;
                gap: 24px !important;
                width: 100% !important;
                min-width: 0 !important;
              }

              .booking-layout__tasks,
              .booking-layout__timeline,
              .booking-layout__checkin,
              .booking-layout__soggiorniamo,
              .booking-layout__documents,
              .booking-layout__actions {
                position: static !important;
                width: 100% !important;
                min-width: 0 !important;
                max-width: 100% !important;
                height: auto !important;
                margin: 0 !important;
                grid-column: auto !important;
                grid-row: auto !important;
              }
            }
          `}</style>

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

        <BookingEditForm booking={booking} />

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
        <div className="booking-layout">
          <div className="booking-layout__tasks">
            <BookingTasks
              bookingId={booking.id}
              propertyId={booking.property.id}
              tasks={tasks}
            />
          </div>

          <div className="booking-layout__timeline">
            <BookingTimeline items={timeline} />
          </div>

          <div className="booking-layout__checkin" style={{ marginTop: 24 }}>
            <BookingGuestCheckInPanel
              bookingId={booking.id}
              guestEmail={booking.guestEmail}
              guestRegistration={booking.guestRegistration}
              initialLink={booking.guestCheckInLink}
              canSubmitToAlloggiati
            />
          </div>

          <div className="booking-layout__soggiorniamo" style={{ marginTop: 24 }}>
            <BookingSoggiorniamoPanel
              guests={booking.soggiorniamoGuests}
            />
          </div>

          <div className="booking-layout__documents" style={{ marginTop: 24 }}>
            <BookingDocuments
              propertyId={booking.property.id}
              documents={documents}
            />
          </div>

          <div className="booking-layout__actions" style={{ marginTop: 24 }}>
            <BookingQuickActions
              bookingId={booking.id}
              propertyId={booking.property.id}
              ownerId={booking.owner.id}
            />
          </div>
        </div>
              </div>
</AppShell>
    </>
  );
}

function OperationalDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          opacity: 0.6,
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div>{value}</div>
    </div>
  );
}
