import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ActionButton } from "@/components/ui/ActionButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { uiTokens } from "@/components/ui/tokens";

export type PropertyDocumentItem = {
  id: string;
  propertyId: string;
  type: string;
  title: string;
  documentNumber: string | null;
  issuer: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  validity: string;
  fileUrl: string | null;
  filename: string | null;
  notes: string | null;
  createdAt: Date;
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
        title="Documentazione immobile"
        subtitle="Licenze, certificazioni, assicurazioni e documenti amministrativi."
        action={
          <ActionButton
            label="Gestisci documenti"
            href={`/properties/${propertyId}/edit`}
            variant="secondary"
            compact
          />
        }
      />

      {documents.length === 0 ? (
        <EmptyState
          title="Nessun documento registrato"
          description="Aggiungi certificazioni, licenze e altri documenti amministrativi dell’immobile."
          actionLabel="Modifica immobile"
          actionHref={`/properties/${propertyId}/edit`}
        />
      ) : (
        <div style={listStyle}>
          {documents.map((document) => (
            <article
              key={document.id}
              style={documentCardStyle}
            >
              <div style={headerStyle}>
                <div>
                  <div style={titleRowStyle}>
                    <strong style={documentTitleStyle}>
                      {document.title}
                    </strong>

                    <StatusBadge
                      label={formatValue(document.type)}
                      tone="blue"
                      compact
                    />

                    <StatusBadge
                      label={formatValue(document.validity)}
                      compact
                    />
                  </div>

                  <p style={subtitleStyle}>
                    {document.issuer
                      ? `Rilasciato da ${document.issuer}`
                      : "Ente emittente non specificato"}
                  </p>
                </div>

                {document.filename ? (
                  <div style={fileStyle}>
                    <span style={fileLabelStyle}>
                      FILE
                    </span>

                    <strong style={fileValueStyle}>
                      {document.filename}
                    </strong>
                  </div>
                ) : null}
              </div>

              <div style={metricsGridStyle}>
                <DocumentMetric
                  label="Numero documento"
                  value={
                    document.documentNumber ??
                    "Non assegnato"
                  }
                />

                <DocumentMetric
                  label="Data rilascio"
                  value={formatDate(document.issueDate)}
                />

                <DocumentMetric
                  label="Data scadenza"
                  value={formatDate(document.expiryDate)}
                />

                <DocumentMetric
                  label="Ultimo aggiornamento"
                  value={formatDate(document.updatedAt)}
                />
              </div>

              {document.notes ? (
                <p style={notesStyle}>
                  {document.notes}
                </p>
              ) : null}

              <div style={footerStyle}>
                <div style={actionsStyle}>
                  {document.fileUrl ? (
                    <ActionButton
                      label="Apri file"
                      href={document.fileUrl}
                      compact
                    />
                  ) : (
                    <span style={missingFileStyle}>
                      Nessun file allegato
                    </span>
                  )}
                </div>

                <span style={updatedTextStyle}>
                  Ultima modifica:{" "}
                  {document.updatedAt.toLocaleString(
                    "it-IT",
                  )}
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
      <strong style={metricValueStyle}>
        {value}
      </strong>
    </div>
  );
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Non definita";
  }

  return date.toLocaleDateString("it-IT");
}

function formatValue(value: string) {
  return value.replaceAll("_", " ");
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

const fileStyle = {
  display: "grid",
  gap: "4px",
  maxWidth: "220px",
  padding: uiTokens.spacing.sm,
  borderRadius: uiTokens.radius.md,
  background: uiTokens.colors.primary,
};

const fileLabelStyle = {
  color: uiTokens.colors.textSubtle,
  fontSize: "9px",
  fontWeight: uiTokens.fontWeight.strong,
};

const fileValueStyle = {
  overflow: "hidden",
  color: uiTokens.colors.primaryText,
  fontSize: uiTokens.fontSize.xs,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(4, minmax(110px, 1fr))",
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

const notesStyle = {
  margin: `${uiTokens.spacing.md} 0 0`,
  paddingTop: uiTokens.spacing.md,
  borderTop: `1px solid ${uiTokens.colors.border}`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
  lineHeight: 1.6,
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

const missingFileStyle = {
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};

const updatedTextStyle = {
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
};