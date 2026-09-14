import { uiTokens } from "./tokens";

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  dark?: boolean;
};

export function SectionTitle({
  title,
  subtitle,
  action,
  dark = false,
}: SectionTitleProps) {
  return (
    <div style={wrapperStyle}>
      <div>
        <h2
          style={{
            ...titleStyle,
            color: dark
              ? uiTokens.colors.primaryText
              : uiTokens.colors.textPrimary,
          }}
        >
          {title}
        </h2>

        {subtitle ? (
          <p
            style={{
              ...subtitleStyle,
              color: dark ? "#94a3b8" : uiTokens.colors.textMuted,
            }}
          >
            {subtitle}
          </p>
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
  fontSize: uiTokens.fontSize.xl,
  fontWeight: uiTokens.fontWeight.strong,
  letterSpacing: "-0.025em",
};

const subtitleStyle = {
  margin: `${uiTokens.spacing.xs} 0 0`,
  fontSize: uiTokens.fontSize.sm,
  lineHeight: 1.5,
};