export const uiTokens = {
  colors: {
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceSoft: "#f8fafc",

    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#64748b",
    textSubtle: "#94a3b8",

    border: "#e2e8f0",
    borderStrong: "#cbd5e1",

    primary: "#0f172a",
    primaryText: "#ffffff",

    blueBackground: "#eff6ff",
    blueBorder: "#bfdbfe",
    blueText: "#1d4ed8",

    greenBackground: "#ecfdf5",
    greenBorder: "#bbf7d0",
    greenText: "#166534",

    yellowBackground: "#fffbeb",
    yellowBorder: "#fde68a",
    yellowText: "#a16207",

    redBackground: "#fff1f2",
    redBorder: "#fecdd3",
    redText: "#be123c",

    violetBackground: "#f5f3ff",
    violetBorder: "#ddd6fe",
    violetText: "#6d28d9",
  },

  radius: {
    sm: "10px",
    md: "14px",
    lg: "18px",
    xl: "22px",
    pill: "999px",
  },

  spacing: {
    xs: "6px",
    sm: "10px",
    md: "16px",
    lg: "22px",
    xl: "28px",
  },

  shadow: {
    soft: "0 8px 26px rgba(15, 23, 42, 0.05)",
    panel: "0 10px 30px rgba(15, 23, 42, 0.06)",
    elevated: "0 14px 38px rgba(15, 23, 42, 0.09)",
  },

  fontSize: {
    xs: "11px",
    sm: "12px",
    md: "14px",
    lg: "18px",
    xl: "22px",
    display: "30px",
  },

  fontWeight: {
    regular: 400,
    medium: 600,
    bold: 800,
    strong: 900,
  },
} as const;

export type UiTone =
  | "default"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "violet";