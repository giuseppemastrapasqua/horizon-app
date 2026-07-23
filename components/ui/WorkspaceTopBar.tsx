import type { ReactNode } from "react";
import { ActionButton } from "./ActionButton";
import { uiTokens } from "./tokens";

type WorkspaceTopBarProps = {
  backLabel: string;
  backHref: string;
  actions?: ReactNode;
};

export function WorkspaceTopBar({
  backLabel,
  backHref,
  actions,
}: WorkspaceTopBarProps) {
  return (
    <div style={wrapperStyle}>
      <ActionButton
        label={`← ${backLabel}`}
        href={backHref}
        variant="secondary"
      />

      {actions ? <div style={actionsStyle}>{actions}</div> : null}
    </div>
  );
}

const wrapperStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: uiTokens.spacing.md,
  marginBottom: uiTokens.spacing.lg,
  flexWrap: "wrap" as const,
};

const actionsStyle = {
  display: "flex",
  gap: uiTokens.spacing.sm,
  flexWrap: "wrap" as const,
};