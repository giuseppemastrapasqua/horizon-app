import { uiTokens, type UiTone } from "./tokens";

type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  tone?: UiTone;
  compact?: boolean;
};

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  tone = "default",
  compact = false,
}: MetricCardProps) {
  const toneStyle = getToneStyle(tone);

  return (
    <div
      style={{
        minHeight: compact ? "112px" : "142px",
        padding: compact
          ? uiTokens.spacing.md
          : uiTokens.spacing.lg,
        borderRadius: uiTokens.radius.lg,
        background: toneStyle.background,
        border: `1px solid ${toneStyle.border}`,
        boxShadow: uiTokens.shadow.soft,
      }}
    >
      <div
        style={{
          color: uiTokens.colors.textMuted,
          fontSize: uiTokens.fontSize.sm,
          fontWeight: uiTokens.fontWeight.bold,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: uiTokens.spacing.sm,
          color: toneStyle.valueColor,
          fontSize: compact
            ? "25px"
            : uiTokens.fontSize.display,
          fontWeight: uiTokens.fontWeight.strong,
          letterSpacing: "-0.04em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      {typeof trend === "number" ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: uiTokens.spacing.xs,
            marginTop: uiTokens.spacing.sm,
            flexWrap: "wrap",
          }}
        >
          <TrendValue value={trend} />

          {trendLabel ? (
            <span
              style={{
                color: uiTokens.colors.textSubtle,
                fontSize: uiTokens.fontSize.xs,
              }}
            >
              {trendLabel}
            </span>
          ) : null}
        </div>
      ) : subtitle ? (
        <p
          style={{
            margin: `${uiTokens.spacing.sm} 0 0`,
            color: uiTokens.colors.textSubtle,
            fontSize: uiTokens.fontSize.xs,
            lineHeight: 1.45,
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function TrendValue({ value }: { value: number }) {
  const positive = value > 0;
  const neutral = value === 0;

  const background = neutral
    ? uiTokens.colors.surfaceSoft
    : positive
      ? uiTokens.colors.greenBackground
      : uiTokens.colors.redBackground;

  const color = neutral
    ? uiTokens.colors.textMuted
    : positive
      ? uiTokens.colors.greenText
      : uiTokens.colors.redText;

  const border = neutral
    ? uiTokens.colors.border
    : positive
      ? uiTokens.colors.greenBorder
      : uiTokens.colors.redBorder;

  const prefix = positive ? "▲" : value < 0 ? "▼" : "•";

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 8px",
        borderRadius: uiTokens.radius.pill,
        background,
        color,
        border: `1px solid ${border}`,
        fontSize: uiTokens.fontSize.xs,
        fontWeight: uiTokens.fontWeight.strong,
        whiteSpace: "nowrap",
      }}
    >
      {prefix} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function getToneStyle(tone: UiTone) {
  if (tone === "blue") {
    return {
      background: uiTokens.colors.blueBackground,
      border: uiTokens.colors.blueBorder,
      valueColor: uiTokens.colors.blueText,
    };
  }

  if (tone === "green") {
    return {
      background: uiTokens.colors.greenBackground,
      border: uiTokens.colors.greenBorder,
      valueColor: uiTokens.colors.greenText,
    };
  }

  if (tone === "yellow") {
    return {
      background: uiTokens.colors.yellowBackground,
      border: uiTokens.colors.yellowBorder,
      valueColor: uiTokens.colors.yellowText,
    };
  }

  if (tone === "red") {
    return {
      background: uiTokens.colors.redBackground,
      border: uiTokens.colors.redBorder,
      valueColor: uiTokens.colors.redText,
    };
  }

  if (tone === "violet") {
    return {
      background: uiTokens.colors.violetBackground,
      border: uiTokens.colors.violetBorder,
      valueColor: uiTokens.colors.violetText,
    };
  }

  return {
    background: uiTokens.colors.surface,
    border: uiTokens.colors.border,
    valueColor: uiTokens.colors.textPrimary,
  };
}