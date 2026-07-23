import type { ReactNode } from "react";
import { uiTokens } from "./tokens";

type WorkspaceGridProps = {
  left: ReactNode;
  right: ReactNode;
  leftWeight?: number;
  rightWeight?: number;
};

export function WorkspaceGrid({
  left,
  right,
  leftWeight = 1.15,
  rightWeight = 0.85,
}: WorkspaceGridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `minmax(0, ${leftWeight}fr) minmax(320px, ${rightWeight}fr)`,
        gap: uiTokens.spacing.lg,
        alignItems: "start",
      }}
    >
      <div style={columnStyle}>{left}</div>
      <div style={columnStyle}>{right}</div>
    </div>
  );
}

const columnStyle = {
  display: "grid",
  gap: uiTokens.spacing.lg,
  minWidth: 0,
};