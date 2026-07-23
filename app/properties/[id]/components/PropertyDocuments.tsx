import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { uiTokens } from "@/components/ui/tokens";

export type PropertyDocumentItem = {
  id: string;
  title: string;
  subtitle: string | null;
  type: string;
  status: string;
  documentNumber: string | null;
  currentVersion: number;
  referenceMonth: Date | null;
  updatedAt: Date;
};

type PropertyDocumentsProps = {
  propertyId: string;
  documents: PropertyDocumentItem[];
};

export function PropertyDocuments({
  propertyId,
  documents,
}: PropertyDocumentsProps) {
  return (
    <Panel>
      <SectionTitle
        title="Documenti immobile"
        subtitle="Rendiconti, report manutenzioni e documentazione collegata."
        action={
          <ActionButton
            label="Apri archivio"
            href={`/documents?propertyId=${propertyId}`}
            variant="secondary"
            compact
          />
        }
      />

      {documents.length === 0 ? (
        <EmptyState
          title="Nessun documento disponibile"
          description="I rendiconti e i report collegati all’immobile compariranno qui."
          actionLabel="Crea rendiconto"
          actionHref={`/reports/monthly/property?propertyId=${propertyId}`}
        />
      ) : (
        <div style={listStyle}>
          {documents.map((document) => (
            <article key={document.id} style={documentCardStyle}>
              <div style={headerStyle}>
                <div>
                  <div style={titleRowStyle}>
                    <strong style={documentTitleStyle}>
                      {document.title}
                    </strong>

                    <StatusBadge
                      label={document.type}
                      tone="blue"
                      compact
                    />

                    <StatusBadge
                      label={document.status}
                      compact
                    />
                  </div>

                  <p style={subtitleStyle}>
                    {document.subtitle ?? "Nessun sottotitolo"}
                  </p>
                </div>

                <div style={versionStyle}>
                  <span style={versionLabelStyle}>VERSIONE</span>
                  <strong style={versionValueStyle}>
                    v{document.currentVersion}
                  </strong>
                </div>
              </div>

              <div style={metricsGridStyle}>
                <DocumentMetric
                  label="Numero"
                  value={document.documentNumber ?? "Non assegnato"}
                />

                <DocumentMetric
                  label="Periodo"
                  value={
                    document.referenceMonth
                      ? document.referenceMonth.toLocaleDateString("it-IT", {
                          month: "long",
                          year: "numeric",
                        })
                      : "Non definito"
                  }
                />

                <DocumentMetric
                  label="Aggiornato"
                  value={document.updatedAt.toLocaleDateString("it-IT")}
                />

                <DocumentMetric
                  label="Stato"
                  value={document.status.replaceAll("_", " ")}
                />
              </div>

              <div style={footerStyle}>
                <div style={actionsStyle}>
                  <ActionButton
                    label="Apri documento"
                    href={`/documents/${document.id}`}
                    compact
                  />

                  <ActionButton
                    label="Storico versioni"
                    href={`/documents/${document.id}/versions`}
                    variant="secondary"
                    compact
                  />
                </div>

                <span style={updatedTextStyle}>
                  Ultima modifica:{" "}
                  {document.updatedAt.toLocaleString("it-IT")}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

function DocumentMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div style={metricLabelStyle}>{label}</div>
      <strong style={metricValueStyle}>{value}</strong>
    </div>
  );
}

const listStyle = {
  display: "grid",
  gap: uiTokens.spacing.md,
};

const documentCardStyle = {
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

const titleRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const documentTitleStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: "16px",
  fontWeight: uiTokens.fontWeight.strong,
};

const subtitleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
};

const versionStyle = {
  display: "grid",
  justifyItems: "center",
  minWidth: "68px",
  padding: uiTokens.spacing.sm,
  borderRadius: uiTokens.radius.md,
  background: uiTokens.colors.primary,
};

const versionLabelStyle = {
  color: uiTokens.colors.textSubtle,
  fontSize: "9px",
  fontWeight: uiTokens.fontWeight.strong,
};

const versionValueStyle = {
  marginTop: "4px",
  color: uiTokens.colors.primaryText,
  fontSize: "18px",
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(110px, 1fr))",
  gap: uiTokens.spacing.md,
  marginTop: uiTokens.spacing.md,
  paddingTop: uiTokens.spacing.md,
  borderTop: `1px solid ${uiTokens.colors.border}`,
};

const metricLabelStyle = {
  marginBottom: "4px",
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};

const metricValueStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.sm,
};

const footerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: uiTokens.spacing.md,
  marginTop: uiTokens.spacing.md,
  paddingTop: uiTokens.spacing.md,
  borderTop: `1px solid ${uiTokens.colors.border}`,
  flexWrap: "wrap" as const,
};

const actionsStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const updatedTextStyle = {
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};