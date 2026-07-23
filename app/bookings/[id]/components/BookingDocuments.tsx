import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { uiTokens } from "@/components/ui/tokens";
import { formatDate } from "@/lib/format/date";

export type BookingDocumentItem = {
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

type BookingDocumentsProps = {
  propertyId: string;
  documents: BookingDocumentItem[];
};

export function BookingDocuments({
  propertyId,
  documents,
}: BookingDocumentsProps) {
  return (
    <Panel>
      <SectionTitle
        title="Documenti"
        subtitle="Documentazione collegata all’immobile e al proprietario."
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
          description="I documenti collegati alla prenotazione compariranno qui."
          actionLabel="Apri archivio"
          actionHref={`/documents?propertyId=${propertyId}`}
        />
      ) : (
        <div style={listStyle}>
          {documents.map((document) => (
            <article key={document.id} style={cardStyle}>
              <div style={headerStyle}>
                <div>
                  <strong style={titleStyle}>
                    {document.title}
                  </strong>

                  <p style={subtitleStyle}>
                    {document.subtitle ?? "Nessun sottotitolo"}
                  </p>
                </div>

                <div style={badgesStyle}>
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
              </div>

              <div style={detailsGridStyle}>
                <DocumentDetail
                  label="Numero"
                  value={
                    document.documentNumber ??
                    "Non assegnato"
                  }
                />

                <DocumentDetail
                  label="Versione"
                  value={`v${document.currentVersion}`}
                />

                <DocumentDetail
                  label="Periodo"
                  value={
                    document.referenceMonth
                      ? formatDate(
                          document.referenceMonth,
                          {
                            month: "long",
                            year: "numeric",
                          }
                        )
                      : "Non definito"
                  }
                />

                <DocumentDetail
                  label="Aggiornato"
                  value={formatDate(document.updatedAt)}
                />
              </div>

              <div style={footerStyle}>
                <ActionButton
                  label="Apri documento"
                  href={`/documents/${document.id}`}
                  compact
                />

                <ActionButton
                  label="Versioni"
                  href={`/documents/${document.id}/versions`}
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

function DocumentDetail({
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
};

const subtitleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
};

const badgesStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(110px, 1fr))",
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
};

const footerStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  marginTop: uiTokens.spacing.md,
  paddingTop: uiTokens.spacing.md,
  borderTop: `1px solid ${uiTokens.colors.border}`,
  flexWrap: "wrap" as const,
};