import { ActionButton } from "./ActionButton";
import { uiTokens } from "./tokens";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div style={wrapperStyle}>
      <strong style={titleStyle}>{title}</strong>

      {description ? (
        <p style={descriptionStyle}>{description}</p>
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
  background: uiTokens.colors.surfaceSoft,
  border: `1px dashed ${uiTokens.colors.borderStrong}`,
  textAlign: "center" as const,
};

const titleStyle = {
  color: uiTokens.colors.textPrimary,
  fontSize: uiTokens.fontSize.md,
  fontWeight: uiTokens.fontWeight.strong,
};

const descriptionStyle = {
  maxWidth: "480px",
  margin: `${uiTokens.spacing.sm} auto 0`,
  color: uiTokens.colors.textMuted,
  fontSize: uiTokens.fontSize.sm,
  lineHeight: 1.5,
};

const actionStyle = {
  marginTop: uiTokens.spacing.md,
};