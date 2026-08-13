import {
  AuditAction,
  FinanceFormulaScope,
  FinanceFormulaStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

import {
  type CreateFormulaPayload,
  validateCreateFormulaPayload,
} from "./create-finance-formula";

export type UpdateFormulaPayload =
  CreateFormulaPayload;

export function validateUpdateFormulaPayload(
  payload: Partial<UpdateFormulaPayload>,
): string | null {
  return validateCreateFormulaPayload(payload);
}

export async function updateFinanceFormula(
  formulaId: string,
  payload: UpdateFormulaPayload,
  actorId: string | null = null,
) {
  const normalizedPropertyId =
    payload.scope ===
    FinanceFormulaScope.ALL_PROPERTIES
      ? null
      : payload.propertyId?.trim() ?? null;

  const normalizedActorId =
    actorId?.trim() || null;

  const formula =
    await prisma.financeFormula.findUnique({
      where: {
        id: formulaId,
      },

      select: {
        id: true,
        propertyId: true,
        scope: true,
        name: true,
        description: true,
        status: true,

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
            base: true,
            value: true,
            referencedFormulaId: true,
          },
        },
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

  const normalizedName =
    payload.name.trim();

  const normalizedDescription =
    payload.description?.trim() || null;

  const normalizedStatus =
    payload.status ??
    FinanceFormulaStatus.DRAFT;

  const updatedFormula =
    await prisma.$transaction(
      async (transaction) => {
        await transaction.financeFormulaRule.deleteMany(
          {
            where: {
              formulaId,
            },
          },
        );

        const savedFormula =
          await transaction.financeFormula.update({
            where: {
              id: formulaId,
            },

            data: {
              scope: payload.scope,

              propertyId:
                normalizedPropertyId,

              name:
                normalizedName,

              description:
                normalizedDescription,

              status:
                normalizedStatus,

              rules: {
                create: payload.rules.map(
                  (rule) => ({
                    name:
                      rule.name.trim(),

                    description:
                      rule.description?.trim() ||
                      null,

                    order:
                      rule.order,

                    isEnabled:
                      rule.isEnabled,

                    operation:
                      rule.operation,

                    valueType:
                      rule.valueType,

                    base:
                      rule.base,

                    value:
                      rule.value,

                    referencedFormulaId:
                      rule.referencedFormulaId ??
                      null,
                  }),
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
          });

        await AuditService.log(
          {
            actorId:
              normalizedActorId,
            action: AuditAction.UPDATE,
            propertyId:
              savedFormula.propertyId,
            entityType:
              "FINANCE_FORMULA",
            entityId:
              savedFormula.id,
            description:
              "Formula finanziaria aggiornata.",
            metadata: {
              previous: {
                propertyId:
                  formula.propertyId,
                scope:
                  formula.scope,
                name:
                  formula.name,
                description:
                  formula.description,
                status:
                  formula.status,
                rulesCount:
                  formula.rules.length,
                rules:
                  formula.rules.map(
                    (rule) => ({
                      id:
                        rule.id,
                      name:
                        rule.name,
                      description:
                        rule.description,
                      order:
                        rule.order,
                      isEnabled:
                        rule.isEnabled,
                      operation:
                        rule.operation,
                      valueType:
                        rule.valueType,
                      base:
                        rule.base,
                      value:
                        Number(rule.value),
                      referencedFormulaId:
                        rule.referencedFormulaId,
                    }),
                  ),
              },

              current: {
                propertyId:
                  savedFormula.propertyId,
                scope:
                  savedFormula.scope,
                name:
                  savedFormula.name,
                description:
                  savedFormula.description,
                status:
                  savedFormula.status,
                rulesCount:
                  savedFormula.rules.length,
                rules:
                  savedFormula.rules.map(
                    (rule) => ({
                      id:
                        rule.id,
                      name:
                        rule.name,
                      description:
                        rule.description,
                      order:
                        rule.order,
                      isEnabled:
                        rule.isEnabled,
                      operation:
                        rule.operation,
                      valueType:
                        rule.valueType,
                      base:
                        rule.base,
                      value:
                        Number(rule.value),
                      referencedFormulaId:
                        rule.referencedFormulaId,
                    }),
                  ),
              },
            },
          },
          transaction,
        );

        return savedFormula;
      },
    );

  return {
    status: "UPDATED" as const,
    formula: updatedFormula,
  };
}