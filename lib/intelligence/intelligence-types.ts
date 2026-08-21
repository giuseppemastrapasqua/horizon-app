export type IntelligenceSeverity =
  | "INFO"
  | "OPPORTUNITY"
  | "WARNING"
  | "CRITICAL";

export type IntelligenceCategory =
  | "REVENUE"
  | "OCCUPANCY"
  | "CALENDAR"
  | "OPERATIONS"
  | "DOCUMENTS"
  | "FINANCE"
  | "MARKETPLACE";

export type IntelligenceActionType =
  | "REVIEW_PRICE"
  | "OPEN_CALENDAR"
  | "APPLY_REVENUE_PRICE"
  | "CREATE_FLASH_OFFER"
  | "REVIEW_TASK"
  | "REVIEW_DOCUMENT"
  | "REVIEW_FINANCE";

export type IntelligenceAction = {
  type: IntelligenceActionType;
  label: string;

  propertyId?: string;
  href?: string;

  requiresApproval: boolean;
};

export type IntelligenceInsight = {
  id: string;

  propertyId: string;
  propertyName: string;

  category: IntelligenceCategory;
  severity: IntelligenceSeverity;

  title: string;
  explanation: string;

  date?: string;

  confidence?: number;

  economicImpact?: {
    amount?: number;
    currency: "EUR";
    direction:
      | "POSITIVE"
      | "NEGATIVE"
      | "UNKNOWN";
  };

  action?: IntelligenceAction;

  metadata?: Record<
    string,
    string | number | boolean | null
  >;
};

export type HorizonIntelligenceBriefing = {
  generatedAt: string;

  portfolio: {
    properties: number;

    criticalInsights: number;
    warnings: number;
    opportunities: number;
  };

  insights: IntelligenceInsight[];
};
