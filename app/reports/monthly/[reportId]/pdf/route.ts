import {
  buildFinanceReportPdf,
  type FinanceReportPdfInput,
} from "@/lib/pdf/finance-report";

import { prisma } from "@/lib/prisma";

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
        formulaName: true,
        createdAt: true,

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

  const pdfInput: FinanceReportPdfInput = {
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
      (booking) => ({
        id: booking.id,
        guestName:
          booking.guestName,
        checkIn: booking.checkIn,
        checkOut:
          booking.checkOut,
        nights: booking.nights,
        guests: booking.guests,
        channel: booking.channel,
        grossAmount: Number(
          booking.grossAmount
        ),
        currency:
          booking.currency,
      })
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