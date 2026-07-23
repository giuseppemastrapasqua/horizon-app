import { type FinanceRule } from "@/lib/finance";

import { type RuleMoveDirection } from "../types";

export function sortRules(
  rules: FinanceRule[]
): FinanceRule[] {
  return [...rules].sort(
    (first, second) =>
      first.order - second.order
  );
}

export function reorderRules(
  rules: FinanceRule[]
): FinanceRule[] {
  return rules.map((rule, index) => ({
    ...rule,
    order: index + 1,
  }));
}

export function addRule(
  rules: FinanceRule[]
): FinanceRule[] {
  const nextOrder =
    Math.max(
      0,
      ...rules.map((rule) => rule.order)
    ) + 1;

  return [
    ...rules,
    {
      id: crypto.randomUUID(),
      name: "Nuova regola",
      description: null,
      order: nextOrder,
      isEnabled: true,
      operation: "SUBTRACT",
      valueType: "FIXED",
      value: 0,
      base: "CURRENT_TOTAL",
    },
  ];
}

export function removeRuleById(
  rules: FinanceRule[],
  ruleId: string
): FinanceRule[] {
  return reorderRules(
    rules.filter(
      (rule) => rule.id !== ruleId
    )
  );
}

export function duplicateRuleById(
  rules: FinanceRule[],
  ruleId: string
): FinanceRule[] {
  const orderedRules = sortRules(rules);

  const sourceIndex = orderedRules.findIndex(
    (rule) => rule.id === ruleId
  );

  if (sourceIndex === -1) {
    return rules;
  }

  const sourceRule = orderedRules[sourceIndex];

  const duplicatedRule: FinanceRule = {
    ...sourceRule,
    id: crypto.randomUUID(),
    name: `${sourceRule.name} copia`,
    order: sourceRule.order + 1,
  };

  return reorderRules([
    ...orderedRules.slice(0, sourceIndex + 1),
    duplicatedRule,
    ...orderedRules.slice(sourceIndex + 1),
  ]);
}

export function moveRuleById(
  rules: FinanceRule[],
  ruleId: string,
  direction: RuleMoveDirection
): FinanceRule[] {
  const orderedRules = sortRules(rules);

  const currentIndex = orderedRules.findIndex(
    (rule) => rule.id === ruleId
  );

  if (currentIndex === -1) {
    return rules;
  }

  const targetIndex =
    direction === "UP"
      ? currentIndex - 1
      : currentIndex + 1;

  if (
    targetIndex < 0 ||
    targetIndex >= orderedRules.length
  ) {
    return rules;
  }

  const reorderedRules = [...orderedRules];

  [
    reorderedRules[currentIndex],
    reorderedRules[targetIndex],
  ] = [
    reorderedRules[targetIndex],
    reorderedRules[currentIndex],
  ];

  return reorderRules(reorderedRules);
}