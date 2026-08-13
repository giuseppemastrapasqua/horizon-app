import { AuditAction } from "@prisma/client";

import {
  buildFinancePreview,
} from "@/lib/finance/preview";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

type CreateFinanceReportParams = {
  propertyId: string;
  referenceMonth: Date | string;
  createdById?: string | null;
  title?: string;
};

export async function createFinanceReport({
  propertyId,
  referenceMonth,
  createdById = null,
  title,
}: CreateFinanceReportParams) {
  const normalizedPropertyId =
    propertyId.trim();

  if (!normalizedPropertyId) {
    throw new Error(
      "È necessario specificare l'immobile.",
    );
  }

  const parsedReferenceMonth =
    referenceMonth instanceof Date
      ? new Date(referenceMonth)
      : new Date(referenceMonth);

  if (
    Number.isNaN(
      parsedReferenceMonth.getTime(),
    )
  ) {
    throw new Error(
      "Il mese di riferimento non è valido.",
    );
  }

  const preview =
    await buildFinancePreview({
      propertyId: normalizedPropertyId,
      referenceMonth:
        parsedReferenceMonth,
    });

  const {
    property,
    bookings,
    formula,
    referenceMonth: monthStart,
    calculation,
  } = preview;

  if (!formula) {
    throw new Error(
      "Non è disponibile alcuna formula finanziaria per questo immobile.",
    );
  }

  if (!calculation) {
    throw new Error(
      "Non è stato possibile calcolare il rendiconto finanziario.",
    );
  }

  const currencies = Array.from(
    new Set(
      bookings.map(
        (booking) => booking.currency,
      ),
    ),
  );

  if (currencies.length > 1) {
    throw new Error(
      "Il rendiconto contiene prenotazioni con valute differenti.",
    );
  }

  const normalizedCreatedById =
    createdById?.trim() || null;

  const reportTitle =
    title?.trim() ||
    createDefaultReportTitle({
      propertyName: property.name,
      referenceMonth: monthStart,
    });

  const formulaSnapshot = {
    id: formula.id,
    name: formula.name,
    description:
      formula.description,
    scope: formula.scope,
    status: formula.status,
    propertyId:
      formula.propertyId,

    rules: formula.rules.map(
      (rule) => ({
        id: rule.id,
        name: rule.name,
        description:
          rule.description,
        order: rule.order,
        isEnabled:
          rule.isEnabled,
        operation:
          rule.operation,
        valueType:
          rule.valueType,
        base: rule.base,
        category:
          rule.category,
        value: Number(rule.value),
        referencedFormulaId:
          rule.referencedFormulaId,
      }),
    ),
  };

  return prisma.$transaction(
    async (transaction) => {
      const report =
        await transaction.financeReport.create({
          data: {
            propertyId: property.id,
            ownerId: property.owner.id,

            formulaId: formula.id,

            createdById:
              normalizedCreatedById,

            referenceMonth: monthStart,
            title: reportTitle,

            currency:
              calculation.currency,

            grossRevenue:
              calculation.grossRevenue,

            finalAmount:
              calculation.finalAmount,

            formulaName:
              calculation.formulaName,

            formulaSnapshot,

            rules: {
              create:
                calculation.rules.map(
                  (rule) => ({
                    sourceRuleId:
                      rule.ruleId,

                    order: rule.order,

                    ruleName:
                      rule.ruleName,

                    operation:
                      rule.operation,

                    valueType:
                      rule.valueType,

                    category:
                      rule.category ??
                      "OTHER",

                    baseAmount:
                      rule.baseAmount,

                    configuredValue:
                      rule.configuredValue,

                    calculatedAmount:
                      rule.calculatedAmount,

                    totalBefore:
                      rule.totalBefore,

                    totalAfter:
                      rule.totalAfter,
                  }),
                ),
            },
          },

          include: {
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                zone: true,
              },
            },

            owner: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },

            formula: {
              select: {
                id: true,
                name: true,
                scope: true,
                status: true,
              },
            },

            createdBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },

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
            normalizedCreatedById,
          action: AuditAction.CREATE,
          propertyId:
            report.propertyId,
          entityType:
            "FINANCE_REPORT",
          entityId: report.id,
          description:
            "Rendiconto finanziario creato.",
          metadata: {
            title: report.title,
            referenceMonth:
              report.referenceMonth.toISOString(),
            currency:
              report.currency,
            grossRevenue:
              Number(report.grossRevenue),
            finalAmount:
              Number(report.finalAmount),
            ownerId:
              report.ownerId,
            formulaId:
              report.formulaId,
            formulaName:
              report.formulaName,
            bookingsCount:
              bookings.length,
            rulesCount:
              report.rules.length,
            rules: report.rules.map(
              (rule) => ({
                id: rule.id,
                sourceRuleId:
                  rule.sourceRuleId,
                order: rule.order,
                ruleName:
                  rule.ruleName,
                operation:
                  rule.operation,
                valueType:
                  rule.valueType,
                category:
                  rule.category,
                baseAmount:
                  Number(rule.baseAmount),
                configuredValue:
                  Number(
                    rule.configuredValue,
                  ),
                calculatedAmount:
                  Number(
                    rule.calculatedAmount,
                  ),
                totalBefore:
                  Number(rule.totalBefore),
                totalAfter:
                  Number(rule.totalAfter),
              }),
            ),
          },
        },
        transaction,
      );

      return report;
    },
  );
}

function createDefaultReportTitle({
  propertyName,
  referenceMonth,
}: {
  propertyName: string;
  referenceMonth: Date;
}): string {
  const formattedMonth =
    new Intl.DateTimeFormat("it-IT", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(referenceMonth);

  return `Rendiconto ${propertyName} · ${capitalizeFirstLetter(
    formattedMonth,
  )}`;
}

function capitalizeFirstLetter(
  value: string,
): string {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}