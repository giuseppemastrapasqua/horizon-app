import {
  FinanceFormulaScope,
  FinanceFormulaStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function findFinanceFormulaForProperty(
  propertyId: string
) {
  const normalizedPropertyId =
    propertyId.trim();

  if (!normalizedPropertyId) {
    throw new Error(
      "L'identificativo dell'immobile è obbligatorio."
    );
  }

  const formulaInclude = {
    rules: {
      orderBy: {
        order: "asc" as const,
      },
    },
  };

  const specificActiveFormula =
    await prisma.financeFormula.findFirst({
      where: {
        propertyId: normalizedPropertyId,
        scope:
          FinanceFormulaScope.SINGLE_PROPERTY,
        status:
          FinanceFormulaStatus.ACTIVE,
      },

      orderBy: {
        updatedAt: "desc",
      },

      include: formulaInclude,
    });

  if (specificActiveFormula) {
    return specificActiveFormula;
  }

  const globalActiveFormula =
    await prisma.financeFormula.findFirst({
      where: {
        propertyId: null,
        scope:
          FinanceFormulaScope.ALL_PROPERTIES,
        status:
          FinanceFormulaStatus.ACTIVE,
      },

      orderBy: {
        updatedAt: "desc",
      },

      include: formulaInclude,
    });

  if (globalActiveFormula) {
    return globalActiveFormula;
  }

  const specificDraftFormula =
    await prisma.financeFormula.findFirst({
      where: {
        propertyId: normalizedPropertyId,
        scope:
          FinanceFormulaScope.SINGLE_PROPERTY,
        status:
          FinanceFormulaStatus.DRAFT,
      },

      orderBy: {
        updatedAt: "desc",
      },

      include: formulaInclude,
    });

  if (specificDraftFormula) {
    return specificDraftFormula;
  }

  return prisma.financeFormula.findFirst({
    where: {
      propertyId: null,
      scope:
        FinanceFormulaScope.ALL_PROPERTIES,
      status:
        FinanceFormulaStatus.DRAFT,
    },

    orderBy: {
      updatedAt: "desc",
    },

    include: formulaInclude,
  });
}