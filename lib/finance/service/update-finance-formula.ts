import {
  FinanceFormulaScope,
  FinanceFormulaStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import {
  type CreateFormulaPayload,
  validateCreateFormulaPayload,
} from "./create-finance-formula";

export type UpdateFormulaPayload =
  CreateFormulaPayload;

export function validateUpdateFormulaPayload(
  payload: Partial<UpdateFormulaPayload>
): string | null {
  return validateCreateFormulaPayload(payload);
}

export async function updateFinanceFormula(
  formulaId: string,
  payload: UpdateFormulaPayload
) {
  const normalizedPropertyId =
    payload.scope ===
    FinanceFormulaScope.ALL_PROPERTIES
      ? null
      : payload.propertyId?.trim() ?? null;

  const formula =
    await prisma.financeFormula.findUnique({
      where: {
        id: formulaId,
      },
      select: {
        id: true,
      },
    });

  if (!formula) {
    return {
      status:
        "FORMULA_NOT_FOUND" as const,
      formula: null,
    };
  }

  if (
    payload.scope ===
    FinanceFormulaScope.SINGLE_PROPERTY
  ) {
    if (!normalizedPropertyId) {
      return {
        status:
          "PROPERTY_NOT_FOUND" as const,
        formula: null,
      };
    }

    const property =
      await prisma.property.findUnique({
        where: {
          id: normalizedPropertyId,
        },
        select: {
          id: true,
        },
      });

    if (!property) {
      return {
        status:
          "PROPERTY_NOT_FOUND" as const,
        formula: null,
      };
    }
  }

  const updatedFormula =
    await prisma.$transaction(
      async (transaction) => {
        await transaction.financeFormulaRule.deleteMany(
          {
            where: {
              formulaId,
            },
          }
        );

        return transaction.financeFormula.update(
          {
            where: {
              id: formulaId,
            },

            data: {
              scope: payload.scope,

              propertyId:
                normalizedPropertyId,

              name: payload.name.trim(),

              description:
                payload.description?.trim() ||
                null,

              status:
                payload.status ??
                FinanceFormulaStatus.DRAFT,

              rules: {
                create: payload.rules.map(
                  (rule) => ({
                    name:
                      rule.name.trim(),

                    description:
                      rule.description?.trim() ||
                      null,

                    order: rule.order,

                    isEnabled:
                      rule.isEnabled,

                    operation:
                      rule.operation,

                    valueType:
                      rule.valueType,

                    base: rule.base,

                    value: rule.value,

                    referencedFormulaId:
                      rule.referencedFormulaId ??
                      null,
                  })
                ),
              },
            },

            include: {
              rules: {
                orderBy: {
                  order: "asc",
                },
              },
            },
          }
        );
      }
    );

  return {
    status: "UPDATED" as const,
    formula: updatedFormula,
  };
}