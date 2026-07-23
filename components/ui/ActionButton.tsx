import Link from "next/link";
import { uiTokens } from "./tokens";

type ActionButtonProps = {
  label: string;
  href?: string;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  compact?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export function ActionButton({
  label,
  href,
  type = "button",
  variant = "primary",
  compact = false,
  disabled = false,
  onClick,
}: ActionButtonProps) {
  const style = getVariantStyle(variant);

  const sharedStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: compact ? "8px 11px" : "10px 14px",
    borderRadius: uiTokens.radius.md,
    background: style.background,
    color: style.color,
    border: `1px solid ${style.border}`,
    textDecoration: "none",
    fontSize: compact
      ? uiTokens.fontSize.xs
      : uiTokens.fontSize.sm,
    fontWeight: uiTokens.fontWeight.bold,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.55 : 1,
    whiteSpace: "nowrap" as const,
  };

  if (href && !disabled) {
    return (
      <Link href={href} style={sharedStyle}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={sharedStyle}
    >
      {label}
    </button>
  );
}

function getVariantStyle(
  variant: NonNullable<ActionButtonProps["variant"]>
) {
  if (variant === "secondary") {
    return {
      background: uiTokens.colors.surface,
      color: uiTokens.colors.textSecondary,
      border: uiTokens.colors.borderStrong,
    };
  }

  if (variant === "danger") {
    return {
      background: uiTokens.colors.redBackground,
      color: uiTokens.colors.redText,
      border: uiTokens.colors.redBorder,
    };
  }

  if (variant === "ghost") {
    return {
      background: "transparent",
      color: uiTokens.colors.textSecondary,
      border: "transparent",
    };
  }

  return {
    background: uiTokens.colors.primary,
    color: uiTokens.colors.primaryText,
    border: uiTokens.colors.primary,
  };
}