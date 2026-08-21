import type {
  FinanceCalculationResult,
  FinanceFormula,
  FinanceRule,
} from "@/lib/finance/formula/types";
import { calculateFinanceFormula } from "@/lib/finance/formula/calculate-finance-formula";
import { prisma } from "@/lib/prisma";

type CalculatePropertyFinanceFormulaParams = {
  formulaId: string;
  grossRevenue: number;
  bookingCount?: number;
  cleaningCost?: number;
  currency?: string;

  channel?:
    | "BOOKING"
    | "AIRBNB"
    | "VRBO"
    | "DIRECT"
    | "OTHER"
    | null;
};

export async function calculatePropertyFinanceFormula({
  formulaId,
  grossRevenue,
  bookingCount = 0,
  cleaningCost = 0,
  channel = null,
  currency = "EUR",
}: CalculatePropertyFinanceFormulaParams): Promise<FinanceCalculationResult> {
  if (!formulaId.trim()) {
    throw new Error(
      "È necessario specificare la formula da calcolare."
    );
  }

  if (!Number.isFinite(grossRevenue)) {
    throw new Error(
      "Il ricavo lordo deve essere un numero valido."
    );
  }

  if (!Number.isFinite(bookingCount)) {
    throw new Error(
      "Il numero di prenotazioni deve essere un numero valido."
    );
  }

  if (!Number.isFinite(cleaningCost)) {
    throw new Error(
      "Il costo pulizie deve essere un numero valido."
    );
  }

  const storedFormulas =
    await prisma.financeFormula.findMany({
      where: {
        status: {
          not: "ARCHIVED",
        },
      },

      select: {
        id: true,
        name: true,
        description: true,

        rules: {
          orderBy: {
            order: "asc",
          },

          select: {
            id: true,
            name: true,
            description: true,
            order: true,
            isEnabled: true,
            operation: true,
            valueType: true,
            value: true,
            base: true,
            category: true,
            referencedFormulaId: true,
          },
        },
      },
    });

  const formulas: FinanceFormula[] =
    storedFormulas.map((storedFormula) => ({
      id: storedFormula.id,
      name: storedFormula.name,
      description:
        storedFormula.description,
      currency,

      rules: storedFormula.rules.map(
        (storedRule): FinanceRule => ({
          id: storedRule.id,
          name: storedRule.name,
          description:
            storedRule.description,

          order: storedRule.order,
          isEnabled:
            storedRule.isEnabled,

          operation:
            storedRule.operation,
          valueType:
            storedRule.valueType,
          value: Number(storedRule.value),

          base: storedRule.base,
          category:
            storedRule.category,

          baseRuleId: null,
          referencedFormulaId:
            storedRule.referencedFormulaId,
        })
      ),
    }));

  const selectedFormula =
    formulas.find(
      (formula) =>
        formula.id === formulaId
    );

  if (!selectedFormula) {
    throw new Error(
      "La formula selezionata non esiste o non è più disponibile."
    );
  }

  return calculateFinanceFormula({
    formula: selectedFormula,
    formulas,
    context: {
      grossRevenue: Math.max(
        0,
        grossRevenue
      ),
      bookingCount: Math.max(
        0,
        Math.floor(bookingCount)
      ),
      cleaningCost: Math.max(
        0,
        cleaningCost
      ),
      channel,
    },
  });
}


