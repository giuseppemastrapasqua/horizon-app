import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ActionButton } from "@/components/ui/ActionButton";
import { uiTokens } from "@/components/ui/tokens";

type OwnerQuickActionsProps = {
  ownerId: string;
  firstPropertyId?: string | null;
};

export function OwnerQuickActions({
  ownerId,
  firstPropertyId,
}: OwnerQuickActionsProps) {
  const actions = [
    {
      title: "Report mensile",
      description: "Apri il report owner del mese corrente.",
      href: `/reports/monthly?ownerId=${ownerId}`,
      primary: true,
    },
    {
      title: "Archivio documenti",
      description: "Consulta report, fatture e rendiconti.",
      href: `/documents?ownerId=${ownerId}`,
    },
    {
      title: "Calendario owner",
      description: "Visualizza prenotazioni e attività del portfolio.",
      href: `/calendar?ownerId=${ownerId}`,
    },
    {
      title: "Nuova prenotazione",
      description: firstPropertyId
        ? "Crea una prenotazione collegata al portfolio."
        : "Il proprietario non ha ancora immobili collegati.",
      href: firstPropertyId
        ? `/bookings/new?propertyId=${firstPropertyId}`
        : "/bookings/new",
    },
    {
      title: "Nuovo task",
      description: firstPropertyId
        ? "Crea un’attività operativa collegata al portfolio."
        : "Crea un task e seleziona successivamente l’immobile.",
      href: firstPropertyId
        ? `/tasks/new?propertyId=${firstPropertyId}`
        : "/tasks/new",
    },
    {
      title: "Fattura commissioni",
      description: "Prepara il documento delle commissioni owner.",
      href: `/invoices/new?ownerId=${ownerId}`,
    },
  ];

  return (
    <Panel>
      <SectionTitle
        title="Azioni rapide"
        subtitle="Accessi diretti alle attività più frequenti per questo proprietario."
      />

      <div style={gridStyle}>
        {actions.map((action) => (
          <article
            key={action.title}
            style={{
              ...cardStyle,
              background: action.primary
                ? uiTokens.colors.primary
                : uiTokens.colors.surfaceSoft,
              border: action.primary
                ? `1px solid ${uiTokens.colors.primary}`
                : `1px solid ${uiTokens.colors.border}`,
            }}
          >
            <strong
              style={{
                color: action.primary
                  ? uiTokens.colors.primaryText
                  : uiTokens.colors.textPrimary,
                fontSize: "15px",
                fontWeight: uiTokens.fontWeight.strong,
              }}
            >
              {action.title}
            </strong>

            <p
              style={{
                margin: `${uiTokens.spacing.xs} 0 ${uiTokens.spacing.md}`,
                color: action.primary
                  ? "#cbd5e1"
                  : uiTokens.colors.textMuted,
                fontSize: uiTokens.fontSize.sm,
                lineHeight: 1.45,
              }}
            >
              {action.description}
            </p>

            <ActionButton
              label="Apri"
              href={action.href}
              variant={action.primary ? "secondary" : "ghost"}
              compact
            />
          </article>
        ))}
      </div>
    </Panel>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(180px, 1fr))",
  gap: uiTokens.spacing.md,
};

const cardStyle = {
  minHeight: "138px",
  padding: uiTokens.spacing.md,
  borderRadius: uiTokens.radius.lg,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "flex-start",
};