import {
  useCallback,
  useMemo,
  useState,
} from "react";

import { type FinanceRule } from "@/lib/finance";

import { initialFormulaRules } from "../data";
import {
  addRule,
  duplicateRuleById,
  moveRuleById,
  removeRuleById,
  sortRules,
} from "../utils";

export function useFormulaRules() {
  const [rules, setRules] =
    useState<FinanceRule[]>(initialFormulaRules);

  const updateRule = useCallback(
    (
      ruleId: string,
      updates: Partial<FinanceRule>
    ) => {
      setRules((currentRules) =>
        currentRules.map((rule) =>
          rule.id === ruleId
            ? {
                ...rule,
                ...updates,
              }
            : rule
        )
      );
    },
    []
  );

  const handleAddRule =
    useCallback(() => {
      setRules((currentRules) =>
        addRule(currentRules)
      );
    }, []);

  const removeRule =
    useCallback((ruleId: string) => {
      setRules((currentRules) =>
        removeRuleById(
          currentRules,
          ruleId
        )
      );
    }, []);

  const duplicateRule =
    useCallback((ruleId: string) => {
      setRules((currentRules) =>
        duplicateRuleById(
          currentRules,
          ruleId
        )
      );
    }, []);

  const moveRule = useCallback(
    (
      ruleId: string,
      direction: "UP" | "DOWN"
    ) => {
      setRules((currentRules) =>
        moveRuleById(
          currentRules,
          ruleId,
          direction
        )
      );
    },
    []
  );

  const replaceRules =
    useCallback(
      (nextRules: FinanceRule[]) => {
        setRules(nextRules);
      },
      []
    );

  const resetRules =
    useCallback(() => {
      setRules(initialFormulaRules);
    }, []);

  const orderedRules = useMemo(
    () => sortRules(rules),
    [rules]
  );

  return {
    rules,
    orderedRules,
    updateRule,
    addRule: handleAddRule,
    removeRule,
    duplicateRule,
    moveRule,
    replaceRules,
    resetRules,
  };
}