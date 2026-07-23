import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WorkspaceGrid } from "@/components/ui/WorkspaceGrid";
import { WorkspaceTimeline } from "@/components/ui/WorkspaceTimeline";
import { WorkspaceTopBar } from "@/components/ui/WorkspaceTopBar";
import { uiTokens } from "@/components/ui/tokens";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { getGuestWorkspace } from "@/lib/guests/get-guest-workspace";

type GuestPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function GuestPage({
  params,
}: GuestPageProps) {
  const { id } = await params;

  const workspace = await getGuestWorkspace(id);

  if (!workspace) {
    notFound();
  }

  const {
    guest,
    metrics,
    bookings,
    tasks,
    propertiesVisited,
    timeline,
  } = workspace;

  return (
    <>
      <Navigation />

      <AppShell
        title={guest.fullName}
        subtitle="Profilo storico e operativo dell’ospite."
      >
        <WorkspaceTopBar
          backLabel="Torna agli ospiti"
          backHref="/guests"
          actions={
            <>
              <ActionButton
                label="Nuova prenotazione"
                href={`/bookings/new?guestId=${guest.id}`}
              />

              <ActionButton
                label="Tutte le prenotazioni"
                href="/bookings"
                variant="secondary"
              />
            </>
          }
        />

        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>
              GUEST WORKSPACE
            </div>

            <h1 style={titleStyle}>
              {guest.fullName}
            </h1>

            <p style={subtitleStyle}>
              {guest.email ??
                guest.phone ??
                "Contatto non disponibile"}
            </p>
          </div>

          <div style={heroBadgesStyle}>
            <StatusBadge
              label={`${metrics.bookingsCount} soggiorni`}
              tone="blue"
            />

            <StatusBadge
              label={
                metrics.bookingsCount > 1
                  ? "OSPITE ABITUALE"
                  : "NUOVO OSPITE"
              }
              tone={
                metrics.bookingsCount > 1
                  ? "green"
                  : "violet"
              }
            />
          </div>
        </section>

        <section style={metricsGridStyle}>
          <MetricCard
            title="Soggiorni"
            value={metrics.bookingsCount}
            subtitle="Prenotazioni collegate"
            tone="blue"
          />

          <MetricCard
            title="Valore generato"
            value={formatCurrency(
              metrics.totalRevenue,
              "EUR"
            )}
            subtitle="Ricavi complessivi"
            tone="green"
          />

          <MetricCard
            title="Notti"
            value={metrics.totalNights}
            subtitle="Notti complessive"
            tone="violet"
          />

          <MetricCard
            title="Immobili visitati"
            value={metrics.propertiesVisitedCount}
            subtitle="Strutture differenti"
          />

          <MetricCard
            title="Task aperti"
            value={metrics.openTasksCount}
            subtitle="Attività da completare"
            tone={
              metrics.openTasksCount > 0
                ? "yellow"
                : "green"
            }
          />

          <MetricCard
            title="Ultimo soggiorno"
            value={
              metrics.latestStayDate
                ? formatDate(metrics.latestStayDate)
                : "Nessuno"
            }
            subtitle="Data ultimo arrivo"
          />
        </section>

        <WorkspaceGrid
          left={
            <>
              <Panel>
                <SectionTitle
                  title="Prenotazioni"
                  subtitle="Storico completo dei soggiorni."
                />

                {bookings.length === 0 ? (
                  <EmptyState
                    title="Nessuna prenotazione"
                    description="Non risultano soggiorni collegati."
                  />
                ) : (
                  <div style={listStyle}>
                    {bookings.map((booking) => (
                      <article
                        key={booking.id}
                        style={cardStyle}
                      >
                        <div style={cardHeaderStyle}>
                          <div>
                            <strong style={cardTitleStyle}>
                              {booking.property.name}
                            </strong>

                            <p style={cardSubtitleStyle}>
                              {formatDate(booking.checkIn)}
                              {" → "}
                              {formatDate(booking.checkOut)}
                            </p>
                          </div>

                          <div style={cardBadgesStyle}>
                            <StatusBadge
                              label={booking.channel}
                              tone="blue"
                              compact
                            />

                            <StatusBadge
                              label={booking.bookingStatus}
                              compact
                            />
                          </div>
                        </div>

                        <div style={cardFooterStyle}>
                          <strong>
                            {formatCurrency(
                              booking.grossAmount,
                              booking.currency
                            )}
                          </strong>

                          <ActionButton
                            label="Apri prenotazione"
                            href={`/bookings/${booking.id}`}
                            variant="secondary"
                            compact
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel>
                <SectionTitle
                  title="Immobili visitati"
                  subtitle="Portfolio utilizzato dall’ospite."
                />

                {propertiesVisited.length === 0 ? (
                  <EmptyState
                    title="Nessun immobile"
                    description="Non risultano immobili collegati."
                  />
                ) : (
                  <div style={listStyle}>
                    {propertiesVisited.map((property) => (
                      <article
                        key={property.id}
                        style={cardStyle}
                      >
                        <strong style={cardTitleStyle}>
                          {property.name}
                        </strong>

                        <p style={cardSubtitleStyle}>
                          {property.zone ?? property.city}
                        </p>

                        <ActionButton
                          label="Apri immobile"
                          href={`/properties/${property.id}`}
                          variant="secondary"
                          compact
                        />
                      </article>
                    ))}
                  </div>
                )}
              </Panel>
            </>
          }
          right={
            <>
              <WorkspaceTimeline
                title="Timeline ospite"
                subtitle="Soggiorni e attività recenti."
                items={timeline}
              />

              <Panel>
                <SectionTitle
                  title="Task collegati"
                  subtitle="Attività generate dai soggiorni."
                />

                {tasks.length === 0 ? (
                  <EmptyState
                    title="Nessun task"
                    description="Non risultano task collegati."
                  />
                ) : (
                  <div style={listStyle}>
                    {tasks.slice(0, 8).map((task) => (
                      <article
                        key={task.id}
                        style={cardStyle}
                      >
                        <strong style={cardTitleStyle}>
                          {task.title}
                        </strong>

                        <p style={cardSubtitleStyle}>
                          {task.property.name} · {task.status}
                        </p>

                        <ActionButton
                          label="Apri task"
                          href={`/tasks/${task.id}`}
                          variant="secondary"
                          compact
                        />
                      </article>
                    ))}
                  </div>
                )}
              </Panel>
            </>
          }
        />
      </AppShell>
    </>
  );
}

const heroStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: uiTokens.spacing.lg,
  marginBottom: uiTokens.spacing.lg,
  padding: uiTokens.spacing.xl,
  borderRadius: uiTokens.radius.xl,
  background:
    "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  border: `1px solid ${uiTokens.colors.border}`,
  boxShadow: uiTokens.shadow.panel,
  flexWrap: "wrap" as const,
};

const eyebrowStyle = {
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.xs,
  fontWeight: uiTokens.fontWeight.strong,
  letterSpacing: "0.08em",
};

const titleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textPrimary,
  fontSize: "34px",
  letterSpacing: "-0.04em",
};

const subtitleStyle = {
  margin: `${uiTokens.spacing.sm} 0 0`,
  color: uiTokens.colors.textMuted,
};

const heroBadgesStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: uiTokens.spacing.md,
  marginBottom: uiTokens.spacing.lg,
};

const listStyle = {
  display: "grid",
  gap: uiTokens.spacing.md,
};

const cardStyle = {
  padding: uiTokens.spacing.md,
  borderRadius: uiTokens.radius.lg,
  background: uiTokens.colors.surfaceSoft,
  border: `1px solid ${uiTokens.colors.border}`,
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: uiTokens.spacing.md,
  flexWrap: "wrap" as const,
};

const cardTitleStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.md,
  fontWeight: uiTokens.fontWeight.strong,
};

const cardSubtitleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
};

const cardBadgesStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const cardFooterStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: uiTokens.spacing.md,
  marginTop: uiTokens.spacing.md,
  paddingTop: uiTokens.spacing.md,
  borderTop: `1px solid ${uiTokens.colors.border}`,
  flexWrap: "wrap" as const,
};