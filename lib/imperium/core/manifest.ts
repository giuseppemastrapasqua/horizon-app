export const imperiumModules = [
  "EVENTS",
  "WORKFLOW",
  "AUTOMATION",
  "DOCUMENTS",
  "REVENUE",
  "NOTIFICATIONS",
  "AI",
] as const;

export type ImperiumModule =
  (typeof imperiumModules)[number];

export const imperiumPrinciples = [
  "Every important change generates an event.",
  "Every operation must be traceable.",
  "Every workflow must be repeatable.",
  "Every integration must be idempotent.",
  "Every module must remain independent.",
] as const;