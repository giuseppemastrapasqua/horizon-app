import {
  buildFinanceReportPdf,
  type FinanceReportPdfInput,
} from "@/lib/pdf/finance-report";

import { prisma } from "@/lib/prisma";

import {
  getPropertyOtaCommissionByChannel,
  resolveOtaCommissionPercent,
} from "@/lib/finance/get-property-ota-commissions";

import {
  buildBookingFinanceBreakdown,
} from "@/lib/finance/calculations/build-booking-finance-breakdown";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    reportId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const { reportId } = await context.params;

  const normalizedReportId =
    reportId.trim();

  if (!normalizedReportId) {
    return new Response(
      "Identificativo rendiconto non valido.",
      {
        status: 400,
      }
    );
  }

  const report =
    await prisma.financeReport.findUnique({
      where: {
        id: normalizedReportId,
      },

      select: {
        id: true,
        title: true,
        referenceMonth: true,
        currency: true,
        grossRevenue: true,
        finalAmount: true,
        formulaId: true,
        formulaName: true,
        createdAt: true,

        adjustments: {
          orderBy: {
            createdAt: "asc",
          },

          select: {
            id: true,
            description: true,
            amount: true,
          },
        },

        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            zone: true,
            cleaningCost: true,
            propertyManagementCommissionPercent: true,
          },
        },

        owner: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },

        createdBy: {
          select: {
            fullName: true,
          },
        },

        rules: {
          orderBy: {
            order: "asc",
          },

          select: {
            id: true,
            order: true,
            ruleName: true,
            operation: true,
            category: true,
            calculatedAmount: true,
                      },
        },
      },
    });

  if (!report) {
    return new Response(
      "Rendiconto non trovato.",
      {
        status: 404,
      }
    );
  }

  const monthStart = new Date(
    Date.UTC(
      report.referenceMonth.getUTCFullYear(),
      report.referenceMonth.getUTCMonth(),
      1
    )
  );

  const nextMonthStart = new Date(
    Date.UTC(
      report.referenceMonth.getUTCFullYear(),
      report.referenceMonth.getUTCMonth() + 1,
      1
    )
  );

  const bookings =
    await prisma.booking.findMany({
      where: {
        propertyId: report.property.id,

        checkIn: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },

      orderBy: [
        {
          checkIn: "asc",
        },
        {
          guestName: "asc",
        },
      ],

      select: {
        id: true,
        guestName: true,
        checkIn: true,
        checkOut: true,
        nights: true,
        guests: true,
        channel: true,
        grossAmount: true,
        currency: true,
      },
    });

  const otaCommissionByChannel =
    await getPropertyOtaCommissionByChannel(
      report.property.id,
    );

  const bookingBreakdowns =
    report.formulaId
      ? await Promise.all(
          bookings.map(
            async (booking) => {
              const breakdown =
                await buildBookingFinanceBreakdown({
                  formulaId:
                    report.formulaId!,
                  grossRevenue:
                    Number(
                      booking.grossAmount
                    ),
                  cleaningCost:
                    Number(
                      report.property.cleaningCost
                    ),

                  propertyManagementCommissionPercent:
                    Number(
                      report.property.propertyManagementCommissionPercent
                    ),
                  otaCommissionPercent:
                    resolveOtaCommissionPercent({
                      channel:
                        booking.channel,

                      commissions:
                        otaCommissionByChannel,
                    }),

                  currency:
                    booking.currency,
                  channel:
                    booking.channel,
                });

              return {
                bookingId:
                  booking.id,
                ...breakdown,
              };
            },
          ),
        )
      : [];

  const bookingBreakdownById =
    new Map(
      bookingBreakdowns.map(
        (item) => [
          item.bookingId,
          item,
        ],
      ),
    );
  const financeReportTemplate =
    await prisma.financeReportTemplate.findFirst({
      where: {
        OR: [
          {
            propertyId:
              report.property.id,
          },
          {
            isDefault: true,
            propertyId: null,
          },
        ],
      },

      orderBy: [
        {
          propertyId: "desc",
        },
        {
          isDefault: "desc",
        },
      ],

      select: {
        name: true,
        headerTitle: true,
        primaryColor: true,
        logoUrl: true,
        footerText: true,
        showBookingDetails: true,
        showOtaCommissions: true,
        showCleaningCosts: true,
        showManagementFees: true,
        showTaxes: true,
        showManualAdjustments: true,
        showCategorySummary: true,
      },
    });

  const resolvedPdfTemplate = {
    name:
      financeReportTemplate?.name ??
      "Rendiconto Horizon",

    headerTitle:
      financeReportTemplate?.headerTitle ??
      "Rendiconto proprietario",

    primaryColor:
      financeReportTemplate?.primaryColor ??
      "#2563EB",

    logoUrl:
      financeReportTemplate?.logoUrl ??
      null,

    footerText:
      financeReportTemplate?.footerText ??
      null,

    showBookingDetails:
      financeReportTemplate?.showBookingDetails ??
      true,

    showOtaCommissions:
      financeReportTemplate?.showOtaCommissions ??
      true,

    showCleaningCosts:
      financeReportTemplate?.showCleaningCosts ??
      true,

    showManagementFees:
      financeReportTemplate?.showManagementFees ??
      true,

    showTaxes:
      financeReportTemplate?.showTaxes ??
      true,

    showManualAdjustments:
      financeReportTemplate?.showManualAdjustments ??
      true,

    showCategorySummary:
      financeReportTemplate?.showCategorySummary ??
      true,
  };
  const pdfInput: FinanceReportPdfInput = {
    template: resolvedPdfTemplate,

    title: report.title,
    referenceMonth:
      report.referenceMonth,
    currency: report.currency,
    grossRevenue: Number(
      report.grossRevenue
    ),
    finalAmount: Number(
      report.finalAmount
    ),
    formulaName:
      report.formulaName,
    createdAt: report.createdAt,

    adjustments:
      report.adjustments.map(
        (adjustment) => ({
          id:
            adjustment.id,

          description:
            adjustment.description,

          amount:
            Number(
              adjustment.amount
            ),
        }),
      ),

    property: {
      name: report.property.name,
      address:
        report.property.address,
      city: report.property.city,
      zone: report.property.zone,
    },

    owner: {
      fullName:
        report.owner.fullName,
      email: report.owner.email,
      phone: report.owner.phone,
    },

    createdBy: report.createdBy
      ? {
          fullName:
            report.createdBy.fullName,
        }
      : null,

    bookings: bookings.map(
      (booking) => {
        const breakdown =
          bookingBreakdownById.get(
            booking.id
          );

        return {
          id:
            booking.id,

          guestName:
            booking.guestName,

          checkIn:
            booking.checkIn,

          checkOut:
            booking.checkOut,

          nights:
            booking.nights,

          guests:
            booking.guests,

          channel:
            booking.channel,

          currency:
            booking.currency,

          grossBooking:
            breakdown?.grossBooking ??
            Number(
              booking.grossAmount
            ),

          otaCommission:
            breakdown?.otaCommission ??
            null,

          cleaningCost:
            breakdown?.cleaningCost ??
            Number(
              report.property.cleaningCost
            ),

          grossProperty:
            breakdown?.grossProperty ??
            null,

          managementCommission:
            breakdown?.managementCommission ??
            null,

          taxAmount:
            breakdown?.taxAmount ??
            null,

          otherAmount:
            breakdown?.otherAmount ??
            null,

          netProperty:
            breakdown?.netProperty ??
            null,
        };
      }
    ),

    rules: report.rules.map((rule) => ({
  id: rule.id,
  order: rule.order,
  ruleName: rule.ruleName,
  operation: rule.operation,
  category: rule.category,
  calculatedAmount: Number(
    rule.calculatedAmount
  ),
})),
  };


  const pdfBytes =
    await buildFinanceReportPdf(
      pdfInput
    );

  const filename =
    createPdfFilename({
      propertyName:
        report.property.name,
      referenceMonth:
        report.referenceMonth,
    });

  return new Response(
    Buffer.from(pdfBytes),
    {
      status: 200,

      headers: {
        "Content-Type":
          "application/pdf",

        "Content-Disposition":
          `attachment; filename="${filename}"`,

        "Cache-Control":
          "private, no-store",
      },
    }
  );
}

function createPdfFilename({
  propertyName,
  referenceMonth,
}: {
  propertyName: string;
  referenceMonth: Date;
}) {
  const month = String(
    referenceMonth.getUTCMonth() +
      1
  ).padStart(2, "0");

  const year =
    referenceMonth.getUTCFullYear();

  const safePropertyName =
    propertyName
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(
        /[^a-zA-Z0-9]+/g,
        "-"
      )
      .replace(/^-+|-+$/g, "")
      .toLowerCase();

  return (
    `rendiconto-${
      safePropertyName ||
      "immobile"
    }` +
    `-${year}-${month}.pdf`
  );
}

























