import { ActionButton } from "./ActionButton";
import { uiTokens } from "./tokens";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  dark?: boolean;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  dark = false,
}: EmptyStateProps) {
  return (
    <div
      style={{
        ...wrapperStyle,
        background: dark
          ? "rgba(255, 255, 255, 0.035)"
          : uiTokens.colors.surfaceSoft,
        border: dark
          ? "1px dashed rgba(148, 163, 184, 0.35)"
          : `1px dashed ${uiTokens.colors.borderStrong}`,
      }}
    >
      <strong
        style={{
          ...titleStyle,
          color: dark
            ? uiTokens.colors.primaryText
            : uiTokens.colors.textPrimary,
        }}
      >
        {title}
      </strong>

      {description ? (
        <p
          style={{
            ...descriptionStyle,
            color: dark ? "#94a3b8" : uiTokens.colors.textMuted,
          }}
        >
          {description}
        </p>
      ) : null}

      {actionLabel && actionHref ? (
        <div style={actionStyle}>
          <ActionButton
            label={actionLabel}
            href={actionHref}
            variant="secondary"
            compact
          />
        </div>
      ) : null}
    </div>
  );
}

const wrapperStyle = {
  padding: uiTokens.spacing.lg,
  borderRadius: uiTokens.radius.lg,
  textAlign: "center" as const,
};

const titleStyle = {
  fontSize: uiTokens.fontSize.md,
  fontWeight: uiTokens.fontWeight.strong,
};

const descriptionStyle = {
  maxWidth: "480px",
  margin: `${uiTokens.spacing.sm} auto 0`,
  fontSize: uiTokens.fontSize.sm,
  lineHeight: 1.5,
};

const actionStyle = {
  marginTop: uiTokens.spacing.md,
};