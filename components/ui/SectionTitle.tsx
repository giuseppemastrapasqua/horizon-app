import { uiTokens } from "./tokens";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function SectionTitle({
  title,
  subtitle,
  action,
}: SectionTitleProps) {
  return (
    <div style={wrapperStyle}>
      <div>
        <h2 style={titleStyle}>{title}</h2>

        {subtitle ? (
          <p style={subtitleStyle}>{subtitle}</p>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}

const wrapperStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: uiTokens.spacing.md,
  marginBottom: uiTokens.spacing.lg,
  flexWrap: "wrap" as const,
};

const titleStyle = {
  margin: 0,
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.xl,
  fontWeight: uiTokens.fontWeight.strong,
  letterSpacing: "-0.025em",
};

const subtitleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
  lineHeight: 1.5,
};