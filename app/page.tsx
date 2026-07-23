import type { ReactNode } from "react";
import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";
import { DashboardKpiLink } from "@/components/dashboard/DashboardKpiLink";
import { DashboardMiniKpi } from "@/components/dashboard/DashboardMiniKpi";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { DashboardStatusPill } from "@/components/dashboard/DashboardStatusPill";
import { DashboardTaskBadge } from "@/components/dashboard/DashboardTaskBadge";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WorkspaceGrid } from "@/components/ui/WorkspaceGrid";
import { uiTokens } from "@/components/ui/tokens";
import { getCommandCenter } from "@/lib/dashboard/get-command-center";
import { formatDateTime } from "@/lib/format/date";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [properties, bookings, tasks, commandCenter] = await Promise.all([
    prisma.property.findMany({
      include: { owner: true, bookings: true, tasks: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.booking.findMany({
      include: { property: true, owner: true },
      orderBy: { checkIn: "asc" },
    }),
    prisma.task.findMany({
      include: { property: true, booking: true },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    getCommandCenter(),
  ]);

  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + Number(booking.grossAmount),
    0
  );

  const activeProperties = properties.filter(
    (property) => property.status === "ACTIVE"
  );

  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const completedTasks = tasks.filter((task) => task.status === "DONE");

  const futureBookings = bookings.filter(
    (booking) => booking.checkIn >= new Date()
  );

  const operationalAlerts = bookings.filter(
    (booking) => booking.operationalStatus !== "OK"
  );

  const averageBookingRevenue =
    bookings.length > 0 ? totalRevenue / bookings.length : 0;

  const urgentTasks = openTasks.slice(0, 4);

  const nextCheckIns = [...futureBookings]
    .sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime())
    .slice(0, 5);

  const nextCheckOuts = [...futureBookings]
    .sort((a, b) => a.checkOut.getTime() - b.checkOut.getTime())
    .slice(0, 5);

  const {
    metrics,
    checkInsToday,
    checkOutsToday,
    priorityTasks,
    generatedAt,
  } = commandCenter;

  return (
    <>
      <Navigation />

      <AppShell
        title="Horizon Executive Dashboard"
        subtitle="Controllo operativo, portfolio e prossime azioni."
      >
        <section style={commandHeaderStyle}>
          <div>
            <div style={commandEyebrowStyle}>
              HORIZON COMMAND CENTER
            </div>

            <h2 style={commandTitleStyle}>
              Controllo operativo di oggi
            </h2>

            <p style={commandSubtitleStyle}>
              Ultimo aggiornamento: {formatDateTime(generatedAt)}
            </p>
          </div>

          <div style={commandActionsStyle}>
            <ActionButton
              label="Nuova prenotazione"
              href="/bookings/new"
            />

            <ActionButton
              label="IMPERIUM Monitor"
              href="/imperium"
              variant="secondary"
            />
          </div>
        </section>

        <section style={metricsGridStyle}>
          <MetricCard
            title="Check-in oggi"
            value={metrics.checkInsToday}
            subtitle="Arrivi previsti"
            tone="blue"
          />

          <MetricCard
            title="Check-out oggi"
            value={metrics.checkOutsToday}
            subtitle="Partenze previste"
            tone="violet"
          />

          <MetricCard
            title="Task aperti"
            value={metrics.openTasks}
            subtitle="Attività prioritarie caricate"
            tone="yellow"
          />

          <MetricCard
            title="Task scaduti"
            value={metrics.overdueTasks}
            subtitle="Richiedono attenzione"
            tone={metrics.overdueTasks > 0 ? "red" : "green"}
          />

          <MetricCard
            title="Eventi in attesa"
            value={metrics.pendingEvents}
            subtitle="Coda IMPERIUM"
            tone={metrics.pendingEvents > 0 ? "yellow" : "green"}
          />

          <MetricCard
            title="Eventi falliti"
            value={metrics.failedEvents}
            subtitle="Automazioni da verificare"
            tone={metrics.failedEvents > 0 ? "red" : "green"}
          />
        </section>

        <WorkspaceGrid
          left={
            <>
              <TodayBookingsPanel
                title="Check-in di oggi"
                emptyTitle="Nessun check-in oggi"
                emptyDescription="Non risultano arrivi previsti per oggi."
                bookings={checkInsToday.map((booking) => ({
                  id: booking.id,
                  guestName: booking.guestName,
                  propertyName: booking.property.name,
                  date: booking.checkIn,
                  channel: booking.channel,
                  operationalStatus: booking.operationalStatus,
                }))}
              />

              <TodayBookingsPanel
                title="Check-out di oggi"
                emptyTitle="Nessun check-out oggi"
                emptyDescription="Non risultano partenze previste per oggi."
                bookings={checkOutsToday.map((booking) => ({
                  id: booking.id,
                  guestName: booking.guestName,
                  propertyName: booking.property.name,
                  date: booking.checkOut,
                  channel: booking.channel,
                  operationalStatus: booking.operationalStatus,
                }))}
              />
            </>
          }
          right={<PriorityTasksPanel tasks={priorityTasks} />}
        />

        <section style={legacyKpiGridStyle}>
          <DashboardKpiLink
            href="/bookings"
            title="Ricavi demo"
            value={`${totalRevenue.toFixed(2)} €`}
            hint="Totale booking caricati"
          />

          <DashboardKpiLink
            href="/properties"
            title="Immobili attivi"
            value={activeProperties.length}
            hint="Portfolio operativo"
          />

          <DashboardKpiLink
            href="/bookings"
            title="Prenotazioni future"
            value={futureBookings.length}
            hint="Soggiorni in calendario"
          />

          <DashboardKpiLink
            href="/bookings"
            title="Alert operativi"
            value={operationalAlerts.length}
            hint="Booking da controllare"
          />
        </section>

        <section style={legacyMiniGridStyle}>
          <DashboardMiniKpi
            href="/tasks?status=open"
            title="Task aperti"
            value={openTasks.length}
          />

          <DashboardMiniKpi
            href="/tasks?status=done"
            title="Task completati"
            value={completedTasks.length}
            tone="green"
          />

          <DashboardMiniKpi
            href="/bookings"
            title="Booking con problemi"
            value={operationalAlerts.length}
            tone="red"
          />

          <DashboardMiniKpi
            href="/bookings"
            title="Ricavo medio booking"
            value={`${averageBookingRevenue.toFixed(0)} €`}
          />
        </section>

        <section style={legacyBookingGridStyle}>
          <ColoredPanel title="Check-in in arrivo" tone="green">
            {nextCheckIns.length === 0 ? (
              <EmptyState
                title="Nessun check-in in arrivo"
                description="Non risultano arrivi imminenti."
              />
            ) : (
              nextCheckIns.map((booking) => (
                <ColoredRow key={booking.id} tone="green">
                  <Link
                    href={`/bookings/${booking.id}`}
                    style={bookingLinkStyle}
                  >
                    {booking.guestName}
                  </Link>

                  <span>
                    {booking.property.name} ·{" "}
                    {booking.checkIn.toLocaleDateString("it-IT")} ·{" "}
                    {booking.channel}
                  </span>
                </ColoredRow>
              ))
            )}
          </ColoredPanel>

          <ColoredPanel title="Check-out in arrivo" tone="red">
            {nextCheckOuts.length === 0 ? (
              <EmptyState
                title="Nessun check-out in arrivo"
                description="Non risultano partenze imminenti."
              />
            ) : (
              nextCheckOuts.map((booking) => (
                <ColoredRow key={booking.id} tone="red">
                  <Link
                    href={`/bookings/${booking.id}`}
                    style={bookingLinkStyle}
                  >
                    {booking.guestName}
                  </Link>

                  <span>
                    {booking.property.name} ·{" "}
                    {booking.checkOut.toLocaleDateString("it-IT")} ·{" "}
                    {booking.channel}
                  </span>
                </ColoredRow>
              ))
            )}
          </ColoredPanel>
        </section>

        <section style={sectionBottomStyle}>
          <AlertPanel title="Attenzione operativa">
            {operationalAlerts.length === 0 ? (
              <DashboardEmptyState text="Nessuna criticità operativa aperta." />
            ) : (
              operationalAlerts.map((booking) => (
                <AlertRow key={booking.id}>
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

                  <DashboardStatusPill value={booking.operationalStatus} />
                </AlertRow>
              ))
            )}
          </AlertPanel>
        </section>

        <section style={sectionBottomStyle}>
          <DashboardPanel title="Task urgenti">
            {urgentTasks.length === 0 ? (
              <DashboardEmptyState text="Nessun task urgente aperto." />
            ) : (
              urgentTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))
            )}
          </DashboardPanel>
        </section>

        <DashboardPanel title="Portfolio immobili">
          <div style={portfolioListStyle}>
            {properties.map((property) => {
              const revenue = property.bookings.reduce(
                (sum, booking) => sum + Number(booking.grossAmount),
                0
              );

              const propertyOpenTasks = property.tasks.filter(
                (task) => task.status !== "DONE"
              );

              return (
                <div key={property.id} style={portfolioRowStyle}>
                  <div>
                    <Link
                      href={`/properties/${property.id}`}
                      style={portfolioTitleStyle}
                    >
                      {property.name}
                    </Link>

                    <div style={portfolioMetaStyle}>
                      {property.zone ?? property.city} ·{" "}
                      {property.commercialClass}
                    </div>
                  </div>

                  <ScoreBadge value={property.currentScore} />
                  <Mini title="Ricavi" value={`${revenue.toFixed(2)} €`} />
                  <Mini
                    title="Task aperti"
                    value={propertyOpenTasks.length}
                  />
                </div>
              );
            })}
          </div>
        </DashboardPanel>
      </AppShell>
    </>
  );
}

type TodayBookingItem = {
  id: string;
  guestName: string;
  propertyName: string;
  date: Date;
  channel: string;
  operationalStatus: string;
};

function TodayBookingsPanel({
  title,
  emptyTitle,
  emptyDescription,
  bookings,
}: {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  bookings: TodayBookingItem[];
}) {
  return (
    <Panel>
      <SectionTitle
        title={title}
        subtitle="Soggiorni pianificati nella giornata."
        action={
          <StatusBadge
            label={`${bookings.length} prenotazioni`}
            compact
          />
        }
      />

      {bookings.length === 0 ? (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
        />
      ) : (
        <div style={commandListStyle}>
          {bookings.map((booking) => (
            <article key={booking.id} style={commandCardStyle}>
              <div>
                <strong style={commandCardTitleStyle}>
                  {booking.guestName}
                </strong>

                <p style={commandCardSubtitleStyle}>
                  {booking.propertyName} ·{" "}
                  {formatDateTime(booking.date)}
                </p>
              </div>

              <div style={commandBadgesStyle}>
                <StatusBadge
                  label={booking.channel}
                  tone="blue"
                  compact
                />

                <StatusBadge
                  label={booking.operationalStatus}
                  compact
                />

                <ActionButton
                  label="Apri"
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
  );
}

type PriorityTaskItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: Date | null;
  property: {
    id: string;
    name: string;
  };
  booking: {
    id: string;
    guestName: string;
  } | null;
  isOverdue: boolean;
};

function PriorityTasksPanel({
  tasks,
}: {
  tasks: PriorityTaskItem[];
}) {
  return (
    <Panel>
      <SectionTitle
        title="Task prioritari"
        subtitle="Attività ordinate per urgenza e scadenza."
        action={
          <ActionButton
            label="Tutti i task"
            href="/tasks"
            variant="secondary"
            compact
          />
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          title="Nessun task prioritario"
          description="Non risultano attività operative aperte."
        />
      ) : (
        <div style={commandListStyle}>
          {tasks.map((task) => (
            <article key={task.id} style={commandCardStyle}>
              <div>
                <strong style={commandCardTitleStyle}>
                  {task.title}
                </strong>

                <p style={commandCardSubtitleStyle}>
                  {task.property.name}
                  {task.booking ? ` · ${task.booking.guestName}` : ""}
                </p>

                <span style={commandTaskDateStyle}>
                  {task.dueDate
                    ? formatDateTime(task.dueDate)
                    : "Scadenza non definita"}
                </span>
              </div>

              <div style={commandBadgesStyle}>
                <StatusBadge
                  label={task.type}
                  tone="blue"
                  compact
                />

                <StatusBadge
                  label={task.isOverdue ? "SCADUTO" : task.status}
                  tone={task.isOverdue ? "red" : "yellow"}
                  compact
                />

                <ActionButton
                  label="Apri"
                  href={`/tasks/${task.id}`}
                  variant="secondary"
                  compact
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

function AlertPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={alertPanelStyle}>
      <div style={alertAccentStyle} />

      <h2 style={alertTitleStyle}>{title}</h2>

      <div style={stack10Style}>{children}</div>
    </section>
  );
}

function AlertRow({ children }: { children: ReactNode }) {
  return <div style={alertRowStyle}>{children}</div>;
}

function ColoredPanel({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "green" | "red";
  children: ReactNode;
}) {
  const styles =
    tone === "green"
      ? {
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          titleColor: "#166534",
          accent: "#22c55e",
        }
      : {
          background: "#fff7f7",
          border: "1px solid #fecaca",
          titleColor: "#be123c",
          accent: "#f43f5e",
        };

  return (
    <section
      style={{
        ...coloredPanelBaseStyle,
        background: styles.background,
        border: styles.border,
      }}
    >
      <div
        style={{
          ...coloredAccentStyle,
          background: styles.accent,
        }}
      />

      <h2
        style={{
          ...coloredTitleBaseStyle,
          color: styles.titleColor,
        }}
      >
        {title}
      </h2>

      <div style={stack10Style}>{children}</div>
    </section>
  );
}

function ColoredRow({
  tone,
  children,
}: {
  tone: "green" | "red";
  children: ReactNode;
}) {
  const styles =
    tone === "green"
      ? {
          border: "1px solid #d1fae5",
          color: "#166534",
        }
      : {
          border: "1px solid #ffe4e6",
          color: "#9f1239",
        };

  return (
    <div
      style={{
        ...coloredRowBaseStyle,
        border: styles.border,
        color: styles.color,
      }}
    >
      {children}
    </div>
  );
}

function TaskRow({
  task,
}: {
  task: {
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    property: { name: string };
  };
}) {
  return (
    <div style={taskRowStyle}>
      <div>
        <Link href={`/tasks/${task.id}`} style={taskTitleStyle}>
          {task.title}
        </Link>

        <div style={taskMetaStyle}>
          {task.property.name} ·{" "}
          {task.dueDate
            ? task.dueDate.toLocaleString("it-IT")
            : "Senza scadenza"}
        </div>
      </div>

      <DashboardTaskBadge status={task.status} />
    </div>
  );
}

function ScoreBadge({ value }: { value: number }) {
  return <div style={scoreBadgeStyle}>{value}</div>;
}

function Mini({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div>
      <div style={miniTitleStyle}>{title}</div>
      <strong style={miniValueStyle}>{value}</strong>
    </div>
  );
}

const bookingLinkStyle = {
  color: "inherit",
  fontWeight: 900,
  textDecoration: "none",
};

const commandHeaderStyle = {
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

const commandEyebrowStyle = {
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.xs,
  fontWeight: uiTokens.fontWeight.strong,
  letterSpacing: "0.08em",
};

const commandTitleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textPrimary,
  fontSize: "30px",
  letterSpacing: "-0.04em",
};

const commandSubtitleStyle = {
  margin: `${uiTokens.spacing.sm} 0 0`,
  color: uiTokens.colors.textMuted,
};

const commandActionsStyle = {
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

const commandListStyle = {
  display: "grid",
  gap: uiTokens.spacing.md,
};

const commandCardStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: uiTokens.spacing.md,
  padding: uiTokens.spacing.md,
  borderRadius: uiTokens.radius.lg,
  background: uiTokens.colors.surfaceSoft,
  border: `1px solid ${uiTokens.colors.border}`,
  flexWrap: "wrap" as const,
};

const commandCardTitleStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.md,
  fontWeight: uiTokens.fontWeight.strong,
};

const commandCardSubtitleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
};

const commandTaskDateStyle = {
  display: "inline-block",
  marginTop: uiTokens.spacing.sm,
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};

const commandBadgesStyle = {
  display: "flex",
  alignItems: "center",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const legacyKpiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: "18px",
  marginTop: "32px",
  marginBottom: "18px",
};

const legacyMiniGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(180px, 1fr))",
  gap: "18px",
  marginBottom: "32px",
};

const legacyBookingGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "22px",
  marginBottom: "22px",
};

const sectionBottomStyle = {
  marginBottom: "32px",
};

const alertPanelStyle = {
  position: "relative" as const,
  overflow: "hidden",
  background: "#fff7f7",
  border: "1px solid #fecaca",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 8px 26px rgba(15, 23, 42, 0.045)",
};

const alertAccentStyle = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "4px",
  background: "#f43f5e",
};

const alertTitleStyle = {
  margin: "2px 0 16px",
  fontSize: "21px",
  color: "#be123c",
  letterSpacing: "-0.02em",
};

const stack10Style = {
  display: "grid",
  gap: "10px",
};

const alertRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  padding: "13px 14px",
  borderRadius: "14px",
  background: "#ffffff",
  border: "1px solid #ffe4e6",
  alignItems: "center",
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

const coloredPanelBaseStyle = {
  position: "relative" as const,
  overflow: "hidden",
  borderRadius: "22px",
  padding: "22px",
  boxShadow: "0 8px 26px rgba(15, 23, 42, 0.045)",
};

const coloredAccentStyle = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  width: "100%",
  height: "4px",
};

const coloredTitleBaseStyle = {
  margin: "2px 0 16px",
  fontSize: "21px",
  letterSpacing: "-0.02em",
};

const coloredRowBaseStyle = {
  display: "grid",
  gap: "3px",
  padding: "13px 14px",
  borderRadius: "14px",
  background: "#ffffff",
};

const taskRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  padding: "14px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
};

const taskTitleStyle = {
  color: "#0f172a",
  fontWeight: 800,
  textDecoration: "none",
};

const taskMetaStyle = {
  marginTop: "4px",
  color: "#64748b",
};

const scoreBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "58px",
  height: "58px",
  borderRadius: "18px",
  background: "#0f172a",
  color: "#fff",
  fontWeight: 950,
  fontSize: "22px",
};

const miniTitleStyle = {
  color: "#64748b",
  fontSize: "13px",
  marginBottom: "5px",
};

const miniValueStyle = {
  color: "#0f172a",
};

const portfolioListStyle = {
  display: "grid",
  gap: "14px",
};

const portfolioRowStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 0.7fr 1fr 1fr",
  gap: "16px",
  padding: "18px",
  borderRadius: "18px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  alignItems: "center",
};

const portfolioTitleStyle = {
  fontSize: "16px",
  color: "#0f172a",
  fontWeight: 800,
  textDecoration: "none",
};

const portfolioMetaStyle = {
  color: "#64748b",
  marginTop: "5px",
};