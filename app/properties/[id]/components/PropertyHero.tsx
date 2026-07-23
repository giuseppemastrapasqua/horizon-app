import { ActionButton } from "@/components/ui/ActionButton";
import { ScoreCard } from "@/components/ui/ScoreCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { uiTokens } from "@/components/ui/tokens";
import { formatDate } from "@/lib/format/date";
import { formatEnum } from "@/lib/format/enum";

type PropertyHeroProps = {
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    zone: string | null;
    status: string;
    commercialClass: string;
    victoryModel: string;
    currentScore: number;
    initialScore: number;
    maxGuests: number;
    bedrooms: number | null;
    bathrooms: number | null;
    createdAt: Date;
    owner: {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
    };
  };
  futureBookingsCount: number;
  currentBookingsCount: number;
  openTasksCount: number;
  operationalAlertsCount: number;
};

export function PropertyHero({
  property,
  futureBookingsCount,
  currentBookingsCount,
  openTasksCount,
  operationalAlertsCount,
}: PropertyHeroProps) {
  const scoreTrend = property.currentScore - property.initialScore;

  return (
    <section style={heroStyle}>
      <div style={contentStyle}>
        <div style={topRowStyle}>
          <div>
            <div style={eyebrowStyle}>PROPERTY WORKSPACE</div>

            <h1 style={titleStyle}>{property.name}</h1>

            <p style={subtitleStyle}>
              {property.address} · {property.zone ?? property.city}
            </p>
          </div>

          <StatusBadge label={property.status} />
        </div>

        <div style={badgeRowStyle}>
          <StatusBadge
            label={formatEnum(property.commercialClass)}
            tone="blue"
            compact
          />

          <StatusBadge
            label={formatEnum(property.victoryModel)}
            tone="violet"
            compact
          />

          <StatusBadge
            label={`${futureBookingsCount} booking futuri`}
            tone="green"
            compact
          />

          <StatusBadge
            label={`${currentBookingsCount} soggiorni in corso`}
            tone={currentBookingsCount > 0 ? "green" : "default"}
            compact
          />

          <StatusBadge
            label={`${openTasksCount} task aperti`}
            tone={openTasksCount > 0 ? "yellow" : "green"}
            compact
          />

          <StatusBadge
            label={
              operationalAlertsCount > 0
                ? `${operationalAlertsCount} criticità`
                : "Nessuna criticità"
            }
            tone={operationalAlertsCount > 0 ? "red" : "green"}
            compact
          />
        </div>

        <div style={detailsGridStyle}>
          <Detail label="Proprietario" value={property.owner.fullName} />
          <Detail label="Capienza" value={`${property.maxGuests} ospiti`} />
          <Detail
            label="Camere"
            value={property.bedrooms ?? "Non indicate"}
          />
          <Detail
            label="Bagni"
            value={property.bathrooms ?? "Non indicati"}
          />
          <Detail
            label="In gestione dal"
            value={formatDate(property.createdAt)}
          />
        </div>

        <div style={actionsStyle}>
          <ActionButton
            label="Nuova prenotazione"
            href={`/bookings/new?propertyId=${property.id}`}
          />

          <ActionButton
            label="Nuovo task"
            href={`/tasks/new?propertyId=${property.id}`}
            variant="secondary"
          />

          <ActionButton
            label="Owner workspace"
            href={`/owners/${property.owner.id}`}
            variant="secondary"
          />

          <ActionButton
            label="Rendiconto immobile"
            href={`/reports/monthly/property?propertyId=${property.id}`}
            variant="secondary"
          />
        </div>
      </div>

      <ScoreCard
        title="Victory Score"
        score={property.currentScore}
        trend={scoreTrend}
        label={formatEnum(property.commercialClass)}
      />
    </section>
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
      <div style={detailLabelStyle}>{label}</div>
      <strong style={detailValueStyle}>{value}</strong>
    </div>
  );
}


const heroStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 240px",
  gap: uiTokens.spacing.lg,
  alignItems: "stretch",
  marginBottom: uiTokens.spacing.lg,
  padding: uiTokens.spacing.xl,
  borderRadius: uiTokens.radius.xl,
  background:
    "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  border: `1px solid ${uiTokens.colors.border}`,
  boxShadow: uiTokens.shadow.panel,
};

const contentStyle = {
  display: "grid",
  alignContent: "space-between",
  gap: uiTokens.spacing.lg,
};

const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: uiTokens.spacing.md,
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
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
};

const subtitleStyle = {
  margin: `${uiTokens.spacing.sm} 0 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.md,
};

const badgeRowStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const detailsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: uiTokens.spacing.md,
};

const detailLabelStyle = {
  marginBottom: "4px",
  color: uiTokens.colors.textSubtle,
  fontSize: uiTokens.fontSize.xs,
  fontWeight: uiTokens.fontWeight.medium,
};

const detailValueStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.sm,
};

const actionsStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};