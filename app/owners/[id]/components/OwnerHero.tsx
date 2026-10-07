import Link from "next/link";
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
          <Link
            href={`/reports/monthly?ownerId=${owner.id}`}
            style={reportButtonStyle}
          >
            Report mensile
          </Link>

          <Link
            href={`/documents?ownerId=${owner.id}`}
            style={documentsButtonStyle}
          >
            Documenti
          </Link>
        </div>
      </div>

      <div style={scoreWrapperStyle}>
        <ScoreCard
          title="Victory Score"
          score={Math.round(averageScore)}
          label={getScoreLabel(averageScore)}
        />
      </div>
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
  gridTemplateColumns: "minmax(0, 1fr) 220px",
  gap: uiTokens.spacing.xl,
  alignItems: "center",
  marginBottom: uiTokens.spacing.lg,
  padding: uiTokens.spacing.xl,
  borderRadius: uiTokens.radius.xl,
  background:
    "linear-gradient(135deg, #0f172a 0%, #111827 100%)",
  border: "1px solid rgba(148,163,184,0.28)",
  boxShadow: uiTokens.shadow.panel,
};

const contentStyle = {
  display: "grid",
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
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.xs,
  fontWeight: uiTokens.fontWeight.strong,
  letterSpacing: "0.08em",
};

const titleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.primaryText,
  fontSize: "34px",
  lineHeight: 1.1,
  letterSpacing: "-0.04em",
};

const subtitleStyle = {
  margin: `${uiTokens.spacing.sm} 0 0`,
  color: "#94a3b8",
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
  color: "#94a3b8",
  fontSize: uiTokens.fontSize.sm,
};

const actionsStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};

const reportButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "44px",
  padding: "10px 18px",
  borderRadius: "12px",
  background: "#e3b95f",
  border: "1px solid #e3b95f",
  color: "#0f172a",
  textDecoration: "none",
  fontSize: uiTokens.fontSize.sm,
  fontWeight: uiTokens.fontWeight.bold,
  boxShadow: "0 8px 20px rgba(227,185,95,0.14)",
};

const documentsButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "44px",
  padding: "10px 18px",
  borderRadius: "12px",
  background: "#1d4ed8",
  border: "1px solid #3b82f6",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: uiTokens.fontSize.sm,
  fontWeight: uiTokens.fontWeight.bold,
  boxShadow: "0 8px 20px rgba(37,99,235,0.16)",
};

const scoreWrapperStyle = {
  width: "100%",
  maxWidth: "220px",
  justifySelf: "end",
  alignSelf: "center",
  padding: "6px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(148,163,184,0.16)",
};
