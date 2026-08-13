import {
  AuditAction,
  FinanceFormulaScope,
  FinanceFormulaStatus,
  FinanceRuleBase,
  FinanceRuleOperation,
  FinanceRuleValueType,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

export type FormulaRulePayload = {
  name: string;
  description?: string | null;
  order: number;
  isEnabled: boolean;
  operation: FinanceRuleOperation;
  valueType: FinanceRuleValueType;
  base: FinanceRuleBase;
  value: number;

  baseRuleId?: string | null;
  referencedFormulaId?: string | null;
};

export type CreateFormulaPayload = {
  scope: FinanceFormulaScope;
  propertyId: string | null;
  name: string;
  description?: string | null;
  status?: FinanceFormulaStatus;
  rules: FormulaRulePayload[];
};

const formulaScopes = Object.values(
  FinanceFormulaScope,
);

const formulaStatuses = Object.values(
  FinanceFormulaStatus,
);

const ruleOperations = Object.values(
  FinanceRuleOperation,
);

const ruleValueTypes = Object.values(
  FinanceRuleValueType,
);

const ruleBases = Object.values(
  FinanceRuleBase,
);

export function validateCreateFormulaPayload(
  payload: Partial<CreateFormulaPayload>,
): string | null {
  if (
    payload.scope === undefined ||
    !formulaScopes.includes(payload.scope)
  ) {
    return "L'ambito della formula non è valido.";
  }

  if (
    payload.scope ===
    FinanceFormulaScope.SINGLE_PROPERTY
  ) {
    if (
      typeof payload.propertyId !== "string" ||
      payload.propertyId.trim() === ""
    ) {
      return "La proprietà è obbligatoria.";
    }
  }

  if (
    payload.scope ===
      FinanceFormulaScope.ALL_PROPERTIES &&
    payload.propertyId !== null &&
    payload.propertyId !== undefined
  ) {
    return "Una formula globale non può essere associata a una proprietà.";
  }

  if (
    typeof payload.name !== "string" ||
    payload.name.trim() === ""
  ) {
    return "Il nome della formula è obbligatorio.";
  }

  if (
    payload.status !== undefined &&
    !formulaStatuses.includes(payload.status)
  ) {
    return "Lo stato della formula non è valido.";
  }

  if (
    !Array.isArray(payload.rules) ||
    payload.rules.length === 0
  ) {
    return "La formula deve contenere almeno una regola.";
  }

  for (const rule of payload.rules) {
    if (
      typeof rule.name !== "string" ||
      rule.name.trim() === ""
    ) {
      return "Ogni regola deve avere un nome.";
    }

    if (
      !Number.isInteger(rule.order) ||
      rule.order < 1
    ) {
      return "L'ordine delle regole non è valido.";
    }

    if (
      typeof rule.isEnabled !== "boolean"
    ) {
      return "Lo stato della regola non è valido.";
    }

    if (
      !ruleOperations.includes(
        rule.operation,
      )
    ) {
      return "L'operazione della regola non è valida.";
    }

    if (
      !ruleValueTypes.includes(
        rule.valueType,
      )
    ) {
      return "Il tipo di valore della regola non è valido.";
    }

    if (!ruleBases.includes(rule.base)) {
      return "La base di calcolo non è valida.";
    }

    if (
      typeof rule.value !== "number" ||
      !Number.isFinite(rule.value) ||
      rule.value < 0
    ) {
      return "Il valore della regola non è valido.";
    }
  }

  return null;
}

export async function createFinanceFormula(
  payload: CreateFormulaPayload,
) {
  const normalizedPropertyId =
    payload.scope ===
    FinanceFormulaScope.ALL_PROPERTIES
      ? null
      : payload.propertyId?.trim() ?? null;

  if (
    payload.scope ===
    FinanceFormulaScope.SINGLE_PROPERTY
  ) {
    if (!normalizedPropertyId) {
      return null;
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
      return null;
    }
  }

  const normalizedName =
    payload.name.trim();

  const normalizedDescription =
    payload.description?.trim() || null;

  const status =
    payload.status ??
    FinanceFormulaStatus.DRAFT;

  return prisma.$transaction(
    async (transaction) => {
      const formula =
        await transaction.financeFormula.create({
          data: {
            scope: payload.scope,
            propertyId:
              normalizedPropertyId,
            name: normalizedName,
            description:
              normalizedDescription,
            status,

            rules: {
              create: payload.rules.map(
                (rule) => ({
                  name: rule.name.trim(),

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
          action: AuditAction.CREATE,
          propertyId:
            formula.propertyId,
          entityType:
            "FINANCE_FORMULA",
          entityId: formula.id,
          description:
            "Formula finanziaria creata.",
          metadata: {
            name: formula.name,
            description:
              formula.description,
            scope: formula.scope,
            status: formula.status,
            propertyId:
              formula.propertyId,
            rulesCount:
              formula.rules.length,
            rules: formula.rules.map(
              (rule) => ({
                id: rule.id,
                name: rule.name,
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
                  rule.referencedFormulaId,
              }),
            ),
          },
        },
        transaction,
      );

      return formula;
    },
  );
}