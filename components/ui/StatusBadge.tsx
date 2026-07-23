import { uiTokens, type UiTone } from "./tokens";

type StatusBadgeProps = {
  label: string;
  tone?: UiTone;
  compact?: boolean;
};

export function StatusBadge({
  label,
  tone = inferTone(label),
  compact = false,
}: StatusBadgeProps) {
  const style = getToneStyle(tone);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: compact ? "5px 8px" : "7px 11px",
        borderRadius: uiTokens.radius.pill,
        background: style.background,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: compact
          ? uiTokens.fontSize.xs
          : uiTokens.fontSize.sm,
        fontWeight: uiTokens.fontWeight.strong,
        whiteSpace: "nowrap",
      }}
    >
      {formatLabel(label)}
    </span>
  );
}

function inferTone(label: string): UiTone {
  const normalized = label.toUpperCase();

  if (
    [
      "ACTIVE",
      "OK",
      "DONE",
      "FINAL",
      "ISSUED",
      "COMPLETED",
      "CONFIRMED",
      "CHECKED_IN",
    ].includes(normalized)
  ) {
    return "green";
  }

  if (
    [
      "IN_PROGRESS",
      "PENDING",
      "DRAFT",
      "DOCUMENTS_PENDING",
      "PAYMENT_PENDING",
      "CLEANING_PENDING",
      "PROCESSING",
    ].includes(normalized)
  ) {
    return "yellow";
  }

  if (
    [
      "FAILED",
      "CANCELLED",
      "ISSUE_OPEN",
      "SUSPENDED",
      "OFFLINE",
    ].includes(normalized)
  ) {
    return "red";
  }

  if (
    [
      "AIRBNB",
      "BOOKING",
      "DIRECT",
      "VRBO",
      "API",
      "SYSTEM",
    ].includes(normalized)
  ) {
    return "blue";
  }

  if (
    [
      "ARCHIVED",
      "INACTIVE",
      "TODO",
      "CHECKED_OUT",
    ].includes(normalized)
  ) {
    return "default";
  }

  return "violet";
}

function getToneStyle(tone: UiTone) {
  if (tone === "blue") {
    return {
      background: uiTokens.colors.blueBackground,
      color: uiTokens.colors.blueText,
      border: uiTokens.colors.blueBorder,
    };
  }

  if (tone === "green") {
    return {
      background: uiTokens.colors.greenBackground,
      color: uiTokens.colors.greenText,
      border: uiTokens.colors.greenBorder,
    };
  }

  if (tone === "yellow") {
    return {
      background: uiTokens.colors.yellowBackground,
      color: uiTokens.colors.yellowText,
      border: uiTokens.colors.yellowBorder,
    };
  }

  if (tone === "red") {
    return {
      background: uiTokens.colors.redBackground,
      color: uiTokens.colors.redText,
      border: uiTokens.colors.redBorder,
    };
  }

  if (tone === "violet") {
    return {
      background: uiTokens.colors.violetBackground,
      color: uiTokens.colors.violetText,
      border: uiTokens.colors.violetBorder,
    };
  }

  return {
    background: uiTokens.colors.surfaceSoft,
    color: uiTokens.colors.textSecondary,
    border: uiTokens.colors.borderStrong,
  };
}

function formatLabel(label: string) {
  return label.replaceAll("_", " ");
}