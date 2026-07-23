import Link from "next/link";

import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { uiTokens } from "@/components/ui/tokens";
import { formatDateTime } from "@/lib/format/date";
import { getImperiumMonitorEvents } from "@/lib/imperium/monitor/get-monitor-events";

type ImperiumMonitorPageProps = {
  searchParams: Promise<{
    query?: string;
    status?: string;
    eventType?: string;
  }>;
};

export default async function ImperiumMonitorPage({
  searchParams,
}: ImperiumMonitorPageProps) {
  const filters = await searchParams;

  const { events, totals } =
    await getImperiumMonitorEvents();

   const normalizedQuery =
  filters.query?.trim().toLowerCase() ?? "";

const filteredEvents = events.filter((event) => {
  const matchesStatus =
    !filters.status ||
    event.status === filters.status;

  const matchesEventType =
    !filters.eventType ||
    event.eventType === filters.eventType;

  const searchableValues = [
    event.id,
    event.eventType,
    event.aggregateType,
    event.aggregateId,
    event.booking?.id,
    event.booking?.guestName,
    event.booking?.guestEmail,
    event.booking?.guestPhone,
    event.booking?.channel,
    event.booking?.property.name,
    event.booking?.owner.fullName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matchesQuery =
    !normalizedQuery ||
    searchableValues.includes(normalizedQuery);

  return (
    matchesStatus &&
    matchesEventType &&
    matchesQuery
  );
});

const eventTypes = Array.from(
  new Set(events.map((event) => event.eventType))
).sort();

  return (
    <>
      <Navigation />

      <AppShell
        title="IMPERIUM Monitor"
        subtitle="Eventi, stato di elaborazione e controllo operativo del motore."
      >
        <section style={metricsGridStyle}>
          <MetricCard
            title="Eventi"
            value={totals.total}
            subtitle="Ultimi 100 eventi"
          />

          <MetricCard
            title="Completati"
            value={totals.completed}
            subtitle="Elaborazioni concluse"
            tone="green"
          />

          <MetricCard
            title="In attesa"
            value={totals.pending}
            subtitle="Eventi ancora da processare"
            tone="yellow"
          />

          <MetricCard
            title="Falliti"
            value={totals.failed}
            subtitle="Eventi da verificare"
            tone={totals.failed > 0 ? "red" : "green"}
          />
        </section>

<section style={filtersStyle}>
  <form method="GET" style={filterFormStyle}>
    <div style={searchFieldStyle}>
      <label htmlFor="query" style={filterLabelStyle}>
        Cerca
      </label>

      <input
        id="query"
        name="query"
        type="search"
        defaultValue={filters.query ?? ""}
        placeholder="Ospite, immobile, email, telefono o ID..."
        style={searchInputStyle}
      />
    </div>

    <div style={filterFieldStyle}>
      <label htmlFor="status" style={filterLabelStyle}>
        Stato
      </label>

      <select
        id="status"
        name="status"
        defaultValue={filters.status ?? ""}
        style={selectStyle}
      >
        <option value="">Tutti gli stati</option>
        <option value="PENDING">PENDING</option>
        <option value="PROCESSING">PROCESSING</option>
        <option value="COMPLETED">COMPLETED</option>
        <option value="FAILED">FAILED</option>
      </select>
    </div>

    <div style={filterFieldStyle}>
      <label htmlFor="eventType" style={filterLabelStyle}>
        Tipo evento
      </label>

      <select
        id="eventType"
        name="eventType"
        defaultValue={filters.eventType ?? ""}
        style={selectStyle}
      >
        <option value="">Tutti gli eventi</option>

        {eventTypes.map((eventType) => (
          <option key={eventType} value={eventType}>
            {eventType}
          </option>
        ))}
      </select>
    </div>

    <button type="submit" style={submitButtonStyle}>
      Applica filtri
    </button>

    <Link href="/imperium" style={resetLinkStyle}>
      Azzera
    </Link>
  </form>
</section>

        <Panel>
          <SectionTitle
            title="Eventi recenti"
            subtitle="Ultimi eventi registrati dall’Event Engine."
          />

          {filteredEvents.length === 0 ? (
            <EmptyState
              title="Nessun evento registrato"
              description="Gli eventi elaborati da IMPERIUM compariranno qui."
            />
          ) : (
            <div style={listStyle}>
              {filteredEvents.map((event) => (
                <article
                  key={event.id}
                  style={eventCardStyle}
                >
                  <div style={headerStyle}>
                    <div>
  <Link
    href={`/imperium/${event.id}`}
    style={titleStyle}
  >
    {event.booking?.guestName ?? event.eventType}
  </Link>

  {event.booking ? (
    <div style={bookingMetaStyle}>
      <span>
        {event.booking.property.name}
      </span>

      <span>
        {formatDateTime(event.booking.checkIn)}
        {" → "}
        {formatDateTime(event.booking.checkOut)}
      </span>

      <span>
        {event.booking.channel}
      </span>

      <span>
        {event.booking.owner.fullName}
      </span>
    </div>
  ) : (
    <p style={subtitleStyle}>
      {event.aggregateType} ·{" "}
      {event.aggregateId}
    </p>
  )}
</div>

                    <StatusBadge
                      label={event.status}
                      tone={getStatusTone(event.status)}
                      compact
                    />
                  </div>

                  <div style={detailsGridStyle}>
                    <EventDetail
                      label="Tentativi"
                      value={event.attempts}
                    />

                    <EventDetail
                      label="Creato"
                      value={formatDateTime(event.createdAt)}
                    />

                    <EventDetail
                      label="Processato"
                      value={
                        event.processedAt
                          ? formatDateTime(event.processedAt)
                          : "Non ancora"
                      }
                    />

                    <EventDetail
                      label="Ultimo errore"
                      value={event.lastError ?? "Nessuno"}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </Panel>
      </AppShell>
    </>
  );
}

function EventDetail({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div style={detailLabelStyle}>{label}</div>
      <strong style={detailValueStyle}>{value}</strong>
    </div>
  );
}

function getStatusTone(status: string) {
  if (status === "COMPLETED") return "green";
  if (status === "FAILED") return "red";
  if (status === "PROCESSING") return "blue";

  return "yellow";
}

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

const eventCardStyle = {
  padding: uiTokens.spacing.md,
  borderRadius: uiTokens.radius.lg,
  background: uiTokens.colors.surfaceSoft,
  border: `1px solid ${uiTokens.colors.border}`,
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: uiTokens.spacing.md,
  flexWrap: "wrap" as const,
};

const titleStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: "16px",
  fontWeight: uiTokens.fontWeight.strong,
  textDecoration: "none",
};

const subtitleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
};

const bookingMetaStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  marginTop: uiTokens.spacing.xs,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
  flexWrap: "wrap" as const,
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(140px, 1fr))",
  gap: uiTokens.spacing.md,
  marginTop: uiTokens.spacing.md,
  paddingTop: uiTokens.spacing.md,
  borderTop: `1px solid ${uiTokens.colors.border}`,
};

const detailLabelStyle = {
  marginBottom: "4px",
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};

const detailValueStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.sm,
  overflowWrap: "anywhere" as const,
};

const filtersStyle = {
  marginBottom: uiTokens.spacing.lg,
  padding: uiTokens.spacing.md,
  borderRadius: uiTokens.radius.lg,
  background: uiTokens.colors.surface,
  border: `1px solid ${uiTokens.colors.border}`,
};

const filterFormStyle = {
  display: "flex",
  alignItems: "end",
  gap: uiTokens.spacing.md,
  flexWrap: "wrap" as const,
};

const filterFieldStyle = {
  display: "grid",
  gap: uiTokens.spacing.xs,
  minWidth: "190px",
};

const filterLabelStyle = {
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.xs,
  fontWeight: uiTokens.fontWeight.strong,
};

const selectStyle = {
  minHeight: "40px",
  padding: `0 ${uiTokens.spacing.sm}`,
  borderRadius: uiTokens.radius.md,
  border: `1px solid ${uiTokens.colors.border}`,
  background: uiTokens.colors.surface,
  color: uiTokens.colors.textPrimary,
};

const submitButtonStyle = {
  minHeight: "40px",
  padding: `0 ${uiTokens.spacing.md}`,
  border: 0,
  borderRadius: uiTokens.radius.md,
  background: uiTokens.colors.primary,
  color: uiTokens.colors.primaryText,
  fontWeight: uiTokens.fontWeight.strong,
  cursor: "pointer",
};

const resetLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: "40px",
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
  textDecoration: "none",
};

const searchFieldStyle = {
  display: "grid",
  gap: uiTokens.spacing.xs,
  flex: "1 1 320px",
  minWidth: "260px",
};

const searchInputStyle = {
  width: "100%",
  minHeight: "40px",
  padding: `0 ${uiTokens.spacing.sm}`,
  borderRadius: uiTokens.radius.md,
  border: `1px solid ${uiTokens.colors.border}`,
  background: uiTokens.colors.surface,
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.sm,
  outline: "none",
  boxSizing: "border-box" as const,
};