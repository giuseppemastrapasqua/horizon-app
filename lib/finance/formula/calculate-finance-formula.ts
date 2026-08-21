import type {
  FinanceCalculationContext,
  FinanceCalculationResult,
  FinanceFormula,
  FinanceRule,
  FinanceRuleResult,
} from "./types";

type CalculateFinanceFormulaParams = {
  formula: FinanceFormula;
  context: FinanceCalculationContext;

  /**
   * Elenco delle formule disponibili per risolvere le regole
   * con valueType === "FORMULA".
   *
   * Può essere omesso quando la formula non contiene riferimenti
   * ad altre formule.
   */
  formulas?: FinanceFormula[];
};

type InternalCalculationParams = {
  formula: FinanceFormula;
  context: FinanceCalculationContext;
  formulasById: Map<string, FinanceFormula>;
  executionPath: string[];
};

export function calculateFinanceFormula({
  formula,
  context,
  formulas = [],
}: CalculateFinanceFormulaParams): FinanceCalculationResult {
  const formulasById = new Map<string, FinanceFormula>();

  for (const availableFormula of formulas) {
    formulasById.set(
      availableFormula.id,
      availableFormula
    );
  }

  formulasById.set(formula.id, formula);

  return calculateFormula({
    formula,
    context,
    formulasById,
    executionPath: [],
  });
}


function calculateFormula({
  formula,
  context,
  formulasById,
  executionPath,
}: InternalCalculationParams): FinanceCalculationResult {
  if (executionPath.includes(formula.id)) {
    const cycle = [
      ...executionPath,
      formula.id,
    ]
      .map((formulaId) => {
        return (
          formulasById.get(formulaId)?.name ??
          formulaId
        );
      })
      .join(" -> ");

    throw new Error(
      `Riferimento circolare rilevato tra le formule: ${cycle}.`
    );
  }

  const nextExecutionPath = [
    ...executionPath,
    formula.id,
  ];

  const enabledRules = [...formula.rules]
    .filter((rule) => rule.isEnabled)
    .sort(
      (first, second) =>
        first.order - second.order
    );

  const ruleResults = new Map<
    string,
    FinanceRuleResult
  >();

  let currentTotal = context.grossRevenue;

  const results: FinanceRuleResult[] = [];

  for (const rule of enabledRules) {
    if (
      rule.category === "OTA_COMMISSION" &&
      rule.channel &&
      context.channel &&
      rule.channel !== context.channel
    ) {
      continue;
    }

    const baseAmount = resolveBaseAmount({
      rule,
      grossRevenue:
        context.grossRevenue,
      currentTotal,
      ruleResults,
    });

    const calculatedAmount =
      calculateRuleAmount({
        rule,
        baseAmount,
        context,
        formulasById,
        executionPath:
          nextExecutionPath,
      });

    const totalBefore = currentTotal;

    const signedAmount =
      rule.operation === "ADD"
        ? calculatedAmount
        : -calculatedAmount;

    currentTotal =
      totalBefore + signedAmount;

    const result: FinanceRuleResult = {
      ruleId: rule.id,
      ruleName: rule.name,
      order: rule.order,
      operation: rule.operation,
      valueType: rule.valueType,
      category:
        rule.category ?? "OTHER",
      baseAmount,
      configuredValue: rule.value,
      calculatedAmount,
      totalBefore,
      totalAfter: currentTotal,
    };

    results.push(result);
    ruleResults.set(rule.id, result);
  }

  return {
    formulaId: formula.id,
    formulaName: formula.name,
    currency: formula.currency,
    grossRevenue:
      context.grossRevenue,
    finalAmount: currentTotal,
    rules: results,
  };
}

function resolveBaseAmount({
  rule,
  grossRevenue,
  currentTotal,
  ruleResults,
}: {
  rule: FinanceRule;
  grossRevenue: number;
  currentTotal: number;
  ruleResults: Map<
    string,
    FinanceRuleResult
  >;
}): number {
  if (
    rule.base === "GROSS_REVENUE"
  ) {
    return grossRevenue;
  }

  if (
    rule.base === "CURRENT_TOTAL"
  ) {
    return currentTotal;
  }

  if (!rule.baseRuleId) {
    throw new Error(
      `La regola "${rule.name}" usa RULE_RESULT ma non specifica baseRuleId.`
    );
  }

  const referencedRule =
    ruleResults.get(rule.baseRuleId);

  if (!referencedRule) {
    throw new Error(
      `La regola "${rule.name}" fa riferimento a una regola non ancora calcolata.`
    );
  }

  return referencedRule.calculatedAmount;
}

function calculateRuleAmount({
  rule,
  baseAmount,
  context,
  formulasById,
  executionPath,
}: {
  rule: FinanceRule;
  baseAmount: number;
  context: FinanceCalculationContext;
  formulasById: Map<
    string,
    FinanceFormula
  >;
  executionPath: string[];
}): number {
  if (
    rule.valueType === "FIXED"
  ) {
    const fixedValue =
      Math.max(0, rule.value);

    if (
  rule.category === "CLEANING"
) {
  return (
    Math.max(
      0,
      context.cleaningCost ?? 0
    ) *
    Math.max(
      0,
      context.bookingCount ?? 0
    )
  );
}

    return fixedValue;
  }

  if (
    rule.valueType === "PERCENTAGE"
  ) {
    return (
      Math.max(0, baseAmount) *
      (Math.max(0, rule.value) / 100)
    );
  }

  return calculateReferencedFormula({
    rule,
    baseAmount,
    context,
    formulasById,
    executionPath,
  });
}

function calculateReferencedFormula({
  rule,
  baseAmount,
  context,
  formulasById,
  executionPath,
}: {
  rule: FinanceRule;
  baseAmount: number;
  context: FinanceCalculationContext;
  formulasById: Map<
    string,
    FinanceFormula
  >;
  executionPath: string[];
}): number {
  if (!rule.referencedFormulaId) {
    throw new Error(
      `La regola "${rule.name}" usa FORMULA ma non specifica referencedFormulaId.`
    );
  }

  const referencedFormula =
    formulasById.get(
      rule.referencedFormulaId
    );

  if (!referencedFormula) {
    throw new Error(
      `La formula referenziata dalla regola "${rule.name}" non è disponibile.`
    );
  }

  const nestedResult =
    calculateFormula({
      formula:
        referencedFormula,
      context: {
        ...context,
        grossRevenue:
          Math.max(0, baseAmount),
      },
      formulasById,
      executionPath,
    });

  return nestedResult.finalAmount;
}

