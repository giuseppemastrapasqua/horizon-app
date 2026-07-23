import { describe, expect, it } from "vitest";

import { calculateFinanceFormula } from "./calculate-finance-formula";
import type { FinanceFormula } from "./types";

describe("calculateFinanceFormula", () => {
  it("calcola una formula annidata", () => {
    const childFormula: FinanceFormula = {
      id: "child",
      name: "Commissione",
      currency: "EUR",
      rules: [
        {
          id: "child-rule",
          name: "Commissione 10%",
          order: 1,
          isEnabled: true,
          operation: "SUBTRACT",
          valueType: "PERCENTAGE",
          value: 10,
          base: "GROSS_REVENUE",
        },
      ],
    };

    const parentFormula: FinanceFormula = {
      id: "parent",
      name: "Ricavo netto",
      currency: "EUR",
      rules: [
        {
          id: "parent-rule",
          name: "Applica commissione",
          order: 1,
          isEnabled: true,
          operation: "SUBTRACT",
          valueType: "FORMULA",
          value: 0,
          base: "GROSS_REVENUE",
          referencedFormulaId: "child",
        },
      ],
    };

    const result = calculateFinanceFormula({
      formula: parentFormula,
      formulas: [childFormula],
      context: {
        grossRevenue: 1000,
      },
    });

    expect(result.finalAmount).toBe(100);
  });

  it("blocca i riferimenti circolari", () => {
    const formulaA: FinanceFormula = {
      id: "formula-a",
      name: "Formula A",
      currency: "EUR",
      rules: [
        {
          id: "rule-a",
          name: "Richiama B",
          order: 1,
          isEnabled: true,
          operation: "ADD",
          valueType: "FORMULA",
          value: 0,
          base: "GROSS_REVENUE",
          referencedFormulaId: "formula-b",
        },
      ],
    };

    const formulaB: FinanceFormula = {
      id: "formula-b",
      name: "Formula B",
      currency: "EUR",
      rules: [
        {
          id: "rule-b",
          name: "Richiama A",
          order: 1,
          isEnabled: true,
          operation: "ADD",
          valueType: "FORMULA",
          value: 0,
          base: "GROSS_REVENUE",
          referencedFormulaId: "formula-a",
        },
      ],
    };

    expect(() =>
      calculateFinanceFormula({
        formula: formulaA,
        formulas: [formulaB],
        context: {
          grossRevenue: 1000,
        },
      })
    ).toThrow("Riferimento circolare rilevato");
  });

  it("genera un errore se la formula referenziata non esiste", () => {
    const formula: FinanceFormula = {
      id: "parent",
      name: "Parent",
      currency: "EUR",
      rules: [
        {
          id: "rule-1",
          name: "Formula mancante",
          order: 1,
          isEnabled: true,
          operation: "ADD",
          valueType: "FORMULA",
          value: 0,
          base: "GROSS_REVENUE",
          referencedFormulaId: "missing-formula",
        },
      ],
    };

    expect(() =>
      calculateFinanceFormula({
        formula,
        formulas: [],
        context: {
          grossRevenue: 1000,
        },
      })
    ).toThrow();
  });
});