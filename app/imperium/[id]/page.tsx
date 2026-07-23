import { notFound } from "next/navigation";

import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { WorkspaceTopBar } from "@/components/ui/WorkspaceTopBar";
import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { uiTokens, type UiTone } from "@/components/ui/tokens";
import { formatDateTime } from "@/lib/format/date";
import { getImperiumMonitorEvent } from "@/lib/imperium/monitor/get-monitor-event";

type ImperiumEventDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ImperiumEventDetailPage({
  params,
}: ImperiumEventDetailPageProps) {
  const { id } = await params;

  const event = await getImperiumMonitorEvent(id);

  if (!event) {
    notFound();
  }

  return (
    <>
      <Navigation />

      <AppShell
        title={event.eventType}
        subtitle="Dettaglio tecnico dell’evento elaborato da IMPERIUM."
      >
        <WorkspaceTopBar
          backLabel="Torna al monitor"
          backHref="/imperium"
        />

        <section style={heroStyle}>
          <div>
            <div style={eyebrowStyle}>
              IMPERIUM EVENT
            </div>

            <h1 style={titleStyle}>
              {event.eventType}
            </h1>

            <p style={subtitleStyle}>
              {event.aggregateType}
              {event.aggregateId
                ? ` · ${event.aggregateId}`
                : ""}
            </p>
          </div>

          <StatusBadge
            label={event.status}
            tone={getStatusTone(event.status)}
          />
        </section>

        <div style={mainGridStyle}>
          <div style={columnStyle}>
            <Panel>
              <SectionTitle
                title="Esecuzione"
                subtitle="Stato, tentativi e tempi di elaborazione."
              />

              <div style={detailsGridStyle}>
                <Detail
                  label="Stato"
                  value={event.status}
                />

                <Detail
                  label="Sorgente"
                  value={event.source}
                />

                <Detail
                  label="Tentativi"
                  value={event.attempts}
                />

                <Detail
                  label="Disponibile"
                  value={formatDateTime(event.availableAt)}
                />

                <Detail
                  label="In lavorazione"
                  value={
                    event.processingAt
                      ? formatDateTime(event.processingAt)
                      : "Non disponibile"
                  }
                />

                <Detail
                  label="Processato"
                  value={
                    event.processedAt
                      ? formatDateTime(event.processedAt)
                      : "Non ancora"
                  }
                />

                <Detail
                  label="Creato"
                  value={formatDateTime(event.createdAt)}
                />

                <Detail
                  label="Aggiornato"
                  value={formatDateTime(event.updatedAt)}
                />
              </div>
            </Panel>

            <Panel>
              <SectionTitle
                title="Payload"
                subtitle="Dati originali associati all’evento."
              />

              <pre style={codeStyle}>
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            </Panel>
          </div>

          <div style={columnStyle}>
            <Panel>
              <SectionTitle
                title="Tracciabilità"
                subtitle="Identificatori per idempotenza e correlazione."
              />

              <div style={stackStyle}>
                <Detail
                  label="Event ID"
                  value={event.id}
                />

                <Detail
                  label="Idempotency key"
                  value={event.idempotencyKey}
                />

                <Detail
                  label="External event ID"
                  value={
                    event.externalEventId ?? "Non presente"
                  }
                />

                <Detail
                  label="Correlation ID"
                  value={
                    event.correlationId ?? "Non presente"
                  }
                />

                <Detail
                  label="Causation ID"
                  value={
                    event.causationId ?? "Non presente"
                  }
                />
              </div>
            </Panel>

            <Panel>
              <SectionTitle
                title="Errore"
                subtitle="Ultimo errore registrato durante l’elaborazione."
              />

              {event.lastError ? (
                <pre style={errorStyle}>
                  {event.lastError}
                </pre>
              ) : (
                <p style={successTextStyle}>
                  Nessun errore registrato.
                </p>
              )}
            </Panel>
          </div>
        </div>
      </AppShell>
    </>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div style={detailLabelStyle}>
        {label}
      </div>

      <strong style={detailValueStyle}>
        {value}
      </strong>
    </div>
  );
}

function getStatusTone(
  status: string
): UiTone {
  if (status === "COMPLETED") return "green";
  if (status === "FAILED") return "red";
  if (status === "PROCESSING") return "blue";

  return "yellow";
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
  fontSize: "32px",
  letterSpacing: "-0.04em",
};

const subtitleStyle = {
  margin: `${uiTokens.spacing.sm} 0 0`,
  color: uiTokens.colors.textMuted,
};

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(340px, 1fr))",
  gap: uiTokens.spacing.lg,
  alignItems: "start",
};

const columnStyle = {
  display: "grid",
  gap: uiTokens.spacing.lg,
  minWidth: 0,
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: uiTokens.spacing.md,
};

const stackStyle = {
  display: "grid",
  gap: uiTokens.spacing.md,
};

const detailLabelStyle = {
  marginBottom: "4px",
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};

const detailValueStyle = {
  display: "block",
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.sm,
  overflowWrap: "anywhere" as const,
};

const codeStyle = {
  margin: 0,
  padding: uiTokens.spacing.md,
  overflowX: "auto" as const,
  borderRadius: uiTokens.radius.md,
  background: "#0f172a",
  color: "#e2e8f0",
  fontSize: "12px",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap" as const,
  overflowWrap: "anywhere" as const,
};

const errorStyle = {
  ...codeStyle,
  background: "#450a0a",
  color: "#fecaca",
};

const successTextStyle = {
  margin: 0,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
};