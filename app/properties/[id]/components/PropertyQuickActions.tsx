import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ActionButton } from "@/components/ui/ActionButton";
import { uiTokens } from "@/components/ui/tokens";

type PropertyQuickActionsProps = {
  propertyId: string;
  ownerId: string;
};

export function PropertyQuickActions({
  propertyId,
  ownerId,
}: PropertyQuickActionsProps) {
  const actions = [
    {
      title: "Nuova prenotazione",
      description: "Registra un nuovo soggiorno per questo immobile.",
      href: `/bookings/new?propertyId=${propertyId}`,
      primary: true,
    },
    {
      title: "Nuovo task",
      description: "Crea una pulizia, manutenzione o attività operativa.",
      href: `/tasks/new?propertyId=${propertyId}`,
    },
    {
      title: "Calendario immobile",
      description: "Visualizza soggiorni e attività pianificate.",
      href: `/calendar?propertyId=${propertyId}`,
    },
    {
      title: "Rendiconto immobile",
      description: "Apri il rendiconto mensile dettagliato.",
      href: `/reports/monthly/property?propertyId=${propertyId}`,
    },
    {
      title: "Documenti",
      description: "Consulta report, rendiconti e manutenzioni.",
      href: `/documents?propertyId=${propertyId}`,
    },
    {
      title: "Owner workspace",
      description: "Apri la console del proprietario collegato.",
      href: `/owners/${ownerId}`,
    },
  ];

  return (
    <Panel>
      <SectionTitle
        title="Azioni rapide"
        subtitle="Accessi diretti alle operazioni più frequenti sull’immobile."
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