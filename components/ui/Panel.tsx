import { uiTokens } from "./tokens";

type PanelProps = {
  children: React.ReactNode;
  padding?: "sm" | "md" | "lg";
  tone?: "default" | "soft" | "success" | "warning" | "danger";
  dark?: boolean;
};

export function Panel({
  children,
  padding = "lg",
  tone = "default",
  dark = false,
}: PanelProps) {
  const paddingValue = {
    sm: uiTokens.spacing.md,
    md: uiTokens.spacing.lg,
    lg: uiTokens.spacing.xl,
  }[padding];

  const toneStyle = dark
    ? {
        background: uiTokens.colors.primary,
        border: "1px solid rgba(148,163,184,0.28)",
      }
    : {
        default: {
          background: uiTokens.colors.surface,
          border: `1px solid ${uiTokens.colors.border}`,
        },
        soft: {
          background: uiTokens.colors.surfaceSoft,
          border: `1px solid ${uiTokens.colors.border}`,
        },
        success: {
          background: uiTokens.colors.greenBackground,
          border: `1px solid ${uiTokens.colors.greenBorder}`,
        },
        warning: {
          background: uiTokens.colors.yellowBackground,
          border: `1px solid ${uiTokens.colors.yellowBorder}`,
        },
        danger: {
          background: uiTokens.colors.redBackground,
          border: `1px solid ${uiTokens.colors.redBorder}`,
        },
      }[tone];

  return (
    <section
      style={{
        ...toneStyle,
        padding: paddingValue,
        borderRadius: uiTokens.radius.xl,
        boxShadow: uiTokens.shadow.panel,
      }}
    >
      {children}
    </section>
  );
}