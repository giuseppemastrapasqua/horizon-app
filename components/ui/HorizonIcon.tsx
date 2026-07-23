import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";

type HorizonIconTone =
  | "default"
  | "muted"
  | "primary"
  | "success"
  | "warning"
  | "danger";

type HorizonIconProps = {
  icon: LucideIcon;
  size?: number;
  strokeWidth?: number;
  tone?: HorizonIconTone;
  label?: string;
};

export function HorizonIcon({
  icon: Icon,
  size = 18,
  strokeWidth = 1.8,
  tone = "default",
  label,
}: HorizonIconProps) {
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      style={{
        ...iconStyle,
        color: toneColors[tone],
      }}
    />
  );
}

const toneColors: Record<HorizonIconTone, string> = {
  default: "#334155",
  muted: "#64748b",
  primary: "#4f46e5",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
};

const iconStyle: CSSProperties = {
  display: "block",
  flex: "0 0 auto",
};