import { ActionButton } from "@/components/ui/ActionButton";
import { ScoreCard } from "@/components/ui/ScoreCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { uiTokens } from "@/components/ui/tokens";

type OwnerHeroProps = {
  owner: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    status: string;
    createdAt: Date;
  };
  propertiesCount: number;
  futureBookingsCount: number;
  openTasksCount: number;
  operationalAlertsCount: number;
  averageScore: number;
};

export function OwnerHero({
  owner,
  propertiesCount,
  futureBookingsCount,
  openTasksCount,
  operationalAlertsCount,
  averageScore,
}: OwnerHeroProps) {
  return (
    <section style={heroStyle}>
      <div style={contentStyle}>
        <div style={topRowStyle}>
          <div>
            <div style={eyebrowStyle}>OWNER WORKSPACE</div>

            <h1 style={titleStyle}>{owner.fullName}</h1>

            <p style={subtitleStyle}>
              {owner.email}
              {owner.phone ? ` · ${owner.phone}` : ""}
            </p>
          </div>

          <StatusBadge label={owner.status} />
        </div>

        <div style={badgeRowStyle}>
          <StatusBadge
            label={`${propertiesCount} immobili`}
            tone="blue"
            compact
          />

          <StatusBadge
            label={`${futureBookingsCount} booking futuri`}
            tone="green"
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

        <div style={metaRowStyle}>
          <span>
            Cliente dal{" "}
            <strong>
              {owner.createdAt.toLocaleDateString("it-IT", {
                month: "long",
                year: "numeric",
              })}
            </strong>
          </span>

          <span>
            Stato account: <strong>{owner.status}</strong>
          </span>
        </div>

        <div style={actionsStyle}>
          <ActionButton
            label="Report mensile"
            href={`/reports/monthly?ownerId=${owner.id}`}
          />

          <ActionButton
            label="Documenti"
            href={`/documents?ownerId=${owner.id}`}
            variant="secondary"
          />
        </div>
      </div>

      <ScoreCard
        title="Victory Score"
        score={Math.round(averageScore)}
        label={getScoreLabel(averageScore)}
      />
    </section>
  );
}

function getScoreLabel(score: number) {
  if (score >= 90) return "Premium Performer";
  if (score >= 80) return "Solid Performer";
  if (score >= 70) return "Volume Performer";
  return "Recovery & Repositioning";
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

const metaRowStyle = {
  display: "flex",
  gap: uiTokens.spacing.lg,
  flexWrap: "wrap" as const,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
};

const actionsStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};