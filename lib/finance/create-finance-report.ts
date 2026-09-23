import { AuditAction } from "@prisma/client";

import {
  buildBookingFinanceBreakdown,
} from "@/lib/finance/calculations/build-booking-finance-breakdown";
import {
  getPropertyOtaCommissionByChannel,
  resolveOtaCommissionPercent,
} from "@/lib/finance/get-property-ota-commissions";
import {
  buildFinancePreview,
} from "@/lib/finance/preview";
import { isCommissionInvoicePrerequisiteError } from "@/lib/invoices/commission-invoice-errors";
import { upsertCommissionInvoiceDraft } from "@/lib/invoices/upsert-commission-invoice-draft";
import { prisma } from "@/lib/prisma";
import { AuditService } from "@/services/audit/AuditService";

type CreateFinanceReportParams = {
  propertyId: string;
  referenceMonth: Date | string;
  createdById?: string | null;
  title?: string;
  existingReportId?: string | null;
};

const HORIZON_STANDARD_NAME =
  "Horizon Standard";

const HORIZON_STANDARD_VERSION =
  1;

const F24_PERCENT = 21;

export async function createFinanceReport({
  propertyId,
  referenceMonth,
  createdById = null,
  title,
  existingReportId = null,
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

  const currency =
    currencies[0] ??
    calculation?.currency ??
    "EUR";

  const financeSettings =
    await prisma.property.findUnique({
      where: {
        id: property.id,
      },
      select: {
        cleaningCost: true,
        propertyManagementCommissionPercent:
          true,
        propertyManagementCommissionVatPercent:
          true,
        propertyManagementCommissionVatMode:
          true,
      },
    });

  if (!financeSettings) {
    throw new Error(
      "Immobile non trovato.",
    );
  }

  const otaCommissionByChannel =
    await getPropertyOtaCommissionByChannel(
      property.id,
    );

  const bookingBreakdowns =
    await Promise.all(
      bookings.map(
        async (booking) =>
          buildBookingFinanceBreakdown({
            formulaId:
              formula?.id ?? null,

            grossRevenue:
              Number(
                booking.grossAmount,
              ),

            cleaningCost:
              Number(
                financeSettings.cleaningCost,
              ),

            otaCommissionPercent:
              resolveOtaCommissionPercent({
                channel:
                  booking.channel,
                commissions:
                  otaCommissionByChannel,
              }),

            propertyManagementCommissionPercent:
              Number(
                financeSettings.propertyManagementCommissionPercent,
              ),

            propertyManagementCommissionVatPercent:
              Number(
                financeSettings.propertyManagementCommissionVatPercent,
              ),

            propertyManagementCommissionVatMode:
              financeSettings.propertyManagementCommissionVatMode,

            currency:
              booking.currency,

            channel:
              booking.channel,
          }),
      ),
    );

  const grossRevenue =
    bookingBreakdowns.reduce(
      (total, breakdown) =>
        total +
        breakdown.grossBooking,
      0,
    );

  const finalAmount =
    bookingBreakdowns.reduce(
      (total, breakdown) =>
        total +
        breakdown.netProperty,
      0,
    );

  const managementCommissionTaxableBaseTotal =
    bookingBreakdowns.reduce(
      (total, breakdown) =>
        total +
        breakdown.managementCommissionTaxableBase,
      0,
    );

  const managementCommissionVatTotal =
    bookingBreakdowns.reduce(
      (total, breakdown) =>
        total +
        breakdown.managementCommissionVat,
      0,
    );

  const managementCommissionTotal =
    bookingBreakdowns.reduce(
      (total, breakdown) =>
        total +
        breakdown.managementCommissionTotal,
      0,
    );

  const normalizedCreatedById =
    createdById?.trim() || null;

  const reportTitle =
    title?.trim() ||
    createDefaultReportTitle({
      propertyName: property.name,
      referenceMonth: monthStart,
    });

  const formulaSnapshot =
    formula
      ? {
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
              value:
                Number(rule.value),
              referencedFormulaId:
                rule.referencedFormulaId,
            }),
          ),
        }
      : {
          type:
            "HORIZON_STANDARD",
          version:
            HORIZON_STANDARD_VERSION,
          name:
            HORIZON_STANDARD_NAME,
          propertyId:
            property.id,
          cleaningCost:
            Number(
              financeSettings.cleaningCost,
            ),
          propertyManagementCommissionPercent:
            Number(
              financeSettings.propertyManagementCommissionPercent,
            ),
          propertyManagementCommissionVatPercent:
            Number(
              financeSettings.propertyManagementCommissionVatPercent,
            ),
          propertyManagementCommissionVatMode:
            financeSettings.propertyManagementCommissionVatMode,
          managementCommissionTaxableBaseTotal,
          managementCommissionVatTotal,
          managementCommissionTotal,
          f24Percent:
            F24_PERCENT,
          otaCommissions:
            Object.fromEntries(
              otaCommissionByChannel,
            ),
        };

  const reportRules =
    calculation?.rules ?? [];

  const report = await prisma.$transaction(
    async (transaction) => {
      if (existingReportId) {
        await transaction.financeReportRule.deleteMany({
          where: {
            reportId: existingReportId,
          },
        });
      }

      const reportData = {
            propertyId:
              property.id,

            ownerId:
              property.owner.id,

            formulaId:
              formula?.id ?? null,

            createdById:
              normalizedCreatedById,

            referenceMonth:
              monthStart,

            title:
              reportTitle,

            currency,

            grossRevenue,

            finalAmount,

            formulaName:
              formula?.name ??
              HORIZON_STANDARD_NAME,

            formulaSnapshot,

            rules: {
              create:
                reportRules.map(
                  (rule) => ({
                    sourceRuleId:
                      rule.ruleId,

                    order:
                      rule.order,

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
          };

      const reportInclude = {
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
                order: "asc" as const,
              },
            },
          };

      const report =
        existingReportId
          ? await transaction.financeReport.update({
              where: {
                id: existingReportId,
              },
              data: reportData,
              include: reportInclude,
            })
          : await transaction.financeReport.create({
              data: reportData,
              include: reportInclude,
            });

      await AuditService.log(
        {
          actorId:
            normalizedCreatedById,
          action:
            existingReportId
              ? AuditAction.UPDATE
              : AuditAction.CREATE,
          propertyId:
            report.propertyId,
          entityType:
            "FINANCE_REPORT",
          entityId:
            report.id,
          description:
            "Rendiconto finanziario creato.",
          metadata: {
            title:
              report.title,
            referenceMonth:
              report.referenceMonth.toISOString(),
            currency:
              report.currency,
            grossRevenue:
              Number(
                report.grossRevenue,
              ),
            finalAmount:
              Number(
                report.finalAmount,
              ),
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
            rules:
              report.rules.map(
                (rule) => ({
                  id:
                    rule.id,
                  sourceRuleId:
                    rule.sourceRuleId,
                  order:
                    rule.order,
                  ruleName:
                    rule.ruleName,
                  operation:
                    rule.operation,
                  valueType:
                    rule.valueType,
                  category:
                    rule.category,
                  baseAmount:
                    Number(
                      rule.baseAmount,
                    ),
                  configuredValue:
                    Number(
                      rule.configuredValue,
                    ),
                  calculatedAmount:
                    Number(
                      rule.calculatedAmount,
                    ),
                  totalBefore:
                    Number(
                      rule.totalBefore,
                    ),
                  totalAfter:
                    Number(
                      rule.totalAfter,
                    ),
                }),
              ),
          },
        },
        transaction,
      );

      return report;
    },
  );

  try {
    await upsertCommissionInvoiceDraft({
      reportId: report.id,
      managementCommissionTaxableBaseTotal,
      managementCommissionVatTotal,
      managementCommissionTotal,
    });
  } catch (error) {
    if (!isCommissionInvoicePrerequisiteError(error)) {
      throw error;
    }
  }

  return report;
}


function createDefaultReportTitle({
  propertyName,
  referenceMonth,
}: {
  propertyName: string;
  referenceMonth: Date;
}): string {
  const formattedMonth =
    new Intl.DateTimeFormat(
      "it-IT",
      {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      },
    ).format(referenceMonth);

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
