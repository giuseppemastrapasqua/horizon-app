export type FinanceRuleOperation =
  | "ADD"
  | "SUBTRACT";

export type FinanceRuleValueType =
  | "FIXED"
  | "PERCENTAGE"
  | "FORMULA";

export type FinanceRuleBase =
  | "GROSS_REVENUE"
  | "CURRENT_TOTAL"
  | "RULE_RESULT";

export type FinanceRuleCategory =
  | "OTA_COMMISSION"
  | "VAT"
  | "CLEANING"
  | "MANAGEMENT_COMMISSION"
  | "TAX"
  | "OTHER";

export type FinanceRule = {
  id: string;
  name: string;
  description?: string | null;

  order: number;
  isEnabled: boolean;

  operation: FinanceRuleOperation;
  valueType: FinanceRuleValueType;
  value: number;

  base: FinanceRuleBase;

  /**
   * Categoria economica usata nei rendiconti.
   *
   * È temporaneamente facoltativa per mantenere compatibili
   * le formule e i test creati prima dell'introduzione
   * di FinanceRuleCategory.
   */
  category?: FinanceRuleCategory;

  /**
   * Canale al quale si applica la regola.
   * Principalmente utilizzato per OTA_COMMISSION.
   * null / undefined = nessun filtro canale.
   */
  channel?:
    | "BOOKING"
    | "AIRBNB"
    | "VRBO"
    | "DIRECT"
    | "OTHER"
    | null;

  /**
   * Necessario solo quando base === "RULE_RESULT".
   * Contiene l'id della regola di cui usare il risultato.
   */
  baseRuleId?: string | null;

  /**
   * Necessario solo quando valueType === "FORMULA".
   * Contiene l'id della formula salvata da eseguire.
   */
  referencedFormulaId?: string | null;
};

export type FinanceFormula = {
  id: string;
  name: string;
  description?: string | null;
  currency: string;
  rules: FinanceRule[];
};

export type FinanceCalculationContext = {
  grossRevenue: number;
  bookingCount?: number;
  cleaningCost?: number;

  channel?:
    | "BOOKING"
    | "AIRBNB"
    | "VRBO"
    | "DIRECT"
    | "OTHER"
    | null;
};

export type FinanceRuleResult = {
  ruleId: string;
  ruleName: string;

  order: number;

  operation: FinanceRuleOperation;
  valueType: FinanceRuleValueType;

  /**
   * Categoria economica della regola.
   *
   * Le vecchie formule senza categoria vengono considerate
   * appartenenti alla categoria OTHER.
   */
  category?: FinanceRuleCategory;

  /**
   * Canale al quale si applica la regola.
   * Principalmente utilizzato per OTA_COMMISSION.
   * null / undefined = nessun filtro canale.
   */
  channel?:
    | "BOOKING"
    | "AIRBNB"
    | "VRBO"
    | "DIRECT"
    | "OTHER"
    | null;

  baseAmount: number;
  configuredValue: number;
  calculatedAmount: number;

  totalBefore: number;
  totalAfter: number;
};

export type FinanceCalculationResult = {
  formulaId: string;
  formulaName: string;
  currency: string;

  grossRevenue: number;
  finalAmount: number;

  rules: FinanceRuleResult[];
};




