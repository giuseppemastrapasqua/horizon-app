import { uiTokens } from "./tokens";

type ScoreCardProps = {
  title?: string;
  score: number;
  maxScore?: number;
  label?: string;
  trend?: number;
};

export function ScoreCard({
  title = "Victory Score",
  score,
  maxScore = 100,
  label,
  trend,
}: ScoreCardProps) {
  const color = getScoreColor(score);

  return (
    <div
      style={{
        background: uiTokens.colors.primary,
        borderRadius: uiTokens.radius.xl,
        padding: uiTokens.spacing.xl,
        color: uiTokens.colors.primaryText,
        boxShadow: uiTokens.shadow.elevated,
        display: "grid",
        justifyItems: "center",
        gap: uiTokens.spacing.sm,
      }}
    >
      <span
        style={{
          color: "#cbd5e1",
          fontSize: uiTokens.fontSize.xs,
          fontWeight: uiTokens.fontWeight.bold,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </span>

      <div
        style={{
          fontSize: "56px",
          fontWeight: uiTokens.fontWeight.strong,
          lineHeight: 1,
          color,
        }}
      >
        {score}
      </div>

      <div
        style={{
          color: "#94a3b8",
          fontSize: uiTokens.fontSize.sm,
        }}
      >
        / {maxScore}
      </div>

      {trend !== undefined ? (
        <Trend trend={trend} />
      ) : null}

      {label ? (
        <span
          style={{
            marginTop: uiTokens.spacing.sm,
            padding: "6px 12px",
            borderRadius: uiTokens.radius.pill,
            background: "rgba(255,255,255,0.08)",
            color: "#ffffff",
            fontSize: uiTokens.fontSize.xs,
            fontWeight: uiTokens.fontWeight.bold,
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

function Trend({ trend }: { trend: number }) {
  const positive = trend > 0;

  return (
    <span
      style={{
        marginTop: uiTokens.spacing.sm,
        color: positive ? "#4ade80" : "#f87171",
        fontWeight: uiTokens.fontWeight.bold,
        fontSize: uiTokens.fontSize.sm,
      }}
    >
      {positive ? "▲" : "▼"} {Math.abs(trend).toFixed(1)} punti
    </span>
  );
}

function getScoreColor(score: number) {
  if (score >= 90) return "#4ade80";
  if (score >= 80) return "#22c55e";
  if (score >= 70) return "#facc15";
  if (score >= 60) return "#fb923c";
  return "#f87171";
}