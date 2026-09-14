import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { ActionButton } from "@/components/ui/ActionButton";
import { uiTokens } from "@/components/ui/tokens";

type BookingQuickActionsProps = {
  bookingId: string;
  propertyId: string;
  ownerId: string;
};

export function BookingQuickActions({
  bookingId,
  propertyId,
  ownerId,
}: BookingQuickActionsProps) {
  const actions = [
    {
      title: "Apri immobile",
      description:
        "Vai al workspace operativo dell’immobile collegato.",
      href: `/properties/${propertyId}`,
      primary: true,
    },
    {
      title: "Owner workspace",
      description:
        "Apri la console del proprietario collegato.",
      href: `/owners/${ownerId}`,
    },
    {
      title: "Nuovo task",
      description:
        "Crea una nuova attività operativa per questa prenotazione.",
      href: `/tasks/new?propertyId=${propertyId}&bookingId=${bookingId}`,
    },
    {
      title: "Documenti",
      description:
        "Consulta la documentazione collegata all’immobile.",
      href: `/documents?propertyId=${propertyId}`,
    },
    {
      title: "Calendario immobile",
      description:
        "Visualizza soggiorni e attività pianificate.",
      href: `/calendar?propertyId=${propertyId}`,
    },
    {
      title: "Torna alle prenotazioni",
      description:
        "Rientra nell’elenco generale delle prenotazioni.",
      href: "/bookings",
    },
  ];

  return (
    <Panel dark>
      <SectionTitle
        dark
        title="Azioni rapide"
        subtitle="Accessi diretti alle attività più frequenti sulla prenotazione."
      />

      <div style={gridStyle}>
        {actions.map((action) => (
          <article
            key={action.title}
            style={{
              ...cardStyle,
              background: action.primary
                ? "rgba(255, 255, 255, 0.07)"
                : "rgba(255, 255, 255, 0.035)",
              border: "none",
            }}
          >
            <strong
              style={{
                color: uiTokens.colors.primaryText,
                fontSize: "15px",
                fontWeight: uiTokens.fontWeight.strong,
              }}
            >
              {action.title}
            </strong>

            <p
              style={{
                margin: `${uiTokens.spacing.xs} 0 ${uiTokens.spacing.md}`,
                color: "#94a3b8",
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
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
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