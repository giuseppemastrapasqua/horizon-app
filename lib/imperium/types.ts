export type ImperiumUrgency =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type ImperiumTone =
  | "success"
  | "warning"
  | "danger"
  | "info";

export type ImperiumFindingType =
  | "STRENGTH"
  | "RISK"
  | "SUGGESTION";

export type ImperiumFinding = {
  id: string;
  type: ImperiumFindingType;
  title: string;
  description: string;
  tone: ImperiumTone;
  priority: number;
};

export type ImperiumEvaluation = {
  score: number;
  urgency: ImperiumUrgency;
  summary: string;
  findings: ImperiumFinding[];
};