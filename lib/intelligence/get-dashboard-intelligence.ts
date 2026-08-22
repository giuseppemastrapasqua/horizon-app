import {
  buildDocumentInsights,
  buildFinanceInsights,
  buildIntelligenceBriefing,
  buildMissingFinanceReportInsights,
  buildTaskInsights,
  getPropertyRevenueIntelligence,
} from "@/lib/intelligence";

import {
  prisma,
} from "@/lib/prisma";

export async function getDashboardIntelligence({
  now = new Date(),
}: {
  now?: Date;
} = {}) {
  const previousMonthStart =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - 1,
        1,
      ),
    );

  const currentMonthStart =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1,
      ),
    );

  const [
    properties,
    tasks,
    documents,
    reports,
    previousMonthBookings,
    previousMonthReports,
  ] =
    await Promise.all([
      prisma.property.findMany({
        select: {
          id: true,
          name: true,
          status: true,
        },
      }),

      /*
       * Task aperti.
       *
       * DONE e CANCELLED non producono
       * Intelligence, quindi non serve
       * caricarli nella Dashboard.
       */
      prisma.task.findMany({
        where: {
          status: {
            in: [
              "TODO",
              "IN_PROGRESS",
            ],
          },
        },

        orderBy: [
          {
            dueDate: "asc",
          },
          {
            createdAt: "desc",
          },
        ],

        take: 100,

        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          dueDate: true,
          ownerId: true,
          propertyId: true,

          property: {
            select: {
              name: true,
            },
          },
        },
      }),

      /*
       * Documenti non archiviati.
       */
      prisma.document.findMany({
        where: {
          status: {
            not: "ARCHIVED",
          },
        },

        orderBy: {
          updatedAt: "desc",
        },

        take: 100,

        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          referenceMonth: true,
          updatedAt: true,
          propertyId: true,

          property: {
            select: {
              name: true,
            },
          },
        },
      }),

      /*
       * Storico Finance.
       *
       * Il builder confronta il rendiconto
       * corrente con il precedente della
       * stessa struttura, quindi manteniamo
       * uno storico sufficiente.
       */
      prisma.financeReport.findMany({
        orderBy: [
          {
            referenceMonth: "desc",
          },
          {
            createdAt: "desc",
          },
        ],

        take: 100,

        select: {
          id: true,
          referenceMonth: true,
          currency: true,
          grossRevenue: true,
          finalAmount: true,

          property: {
            select: {
              id: true,
              name: true,
            },
          },

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

          rules: {
            orderBy: {
              order: "asc",
            },

            select: {
              id: true,
              ruleName: true,
              operation: true,
              category: true,
              calculatedAmount: true,
            },
          },
        },
      }),

      /*
       * Booking del mese precedente
       * necessari per rilevare rendiconti
       * mancanti.
       */
      prisma.booking.findMany({
        where: {
          bookingStatus: {
            not: "CANCELLED",
          },

          checkIn: {
            gte:
              previousMonthStart,
            lt:
              currentMonthStart,
          },
        },

        select: {
          id: true,
          propertyId: true,
          checkIn: true,
          grossAmount: true,
        },
      }),

      prisma.financeReport.findMany({
        where: {
          referenceMonth:
            previousMonthStart,
        },

        select: {
          id: true,
          propertyId: true,
          referenceMonth: true,
        },
      }),
    ]);

  const taskInsights =
    buildTaskInsights({
      tasks:
        tasks.map(
          (task) => ({
            id:
              task.id,

            title:
              task.title,

            type:
              task.type,

            status:
              task.status,

            dueDate:
              task.dueDate,

            ownerId:
              task.ownerId,

            propertyId:
              task.propertyId,

            propertyName:
              task.property.name,
          }),
        ),

      now,
    });

  const documentInsights =
    buildDocumentInsights({
      documents:
        documents.map(
          (document) => ({
            id:
              document.id,

            title:
              document.title,

            type:
              document.type,

            status:
              document.status,

            referenceMonth:
              document.referenceMonth,

            updatedAt:
              document.updatedAt,

            propertyId:
              document.propertyId,

            propertyName:
              document.property?.name ??
              null,
          }),
        ),

      now,
    });

  const financeInsights =
    buildFinanceInsights({
      reports:
        reports.map(
          (report) => ({
            id:
              report.id,

            propertyId:
              report.property.id,

            propertyName:
              report.property.name,

            referenceMonth:
              report.referenceMonth,

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

            adjustments:
              report.adjustments.map(
                (adjustment) => ({
                  id:
                    adjustment.id,

                  description:
                    adjustment.description,

                  amount:
                    Number(
                      adjustment.amount,
                    ),
                }),
              ),

            rules:
              report.rules.map(
                (rule) => ({
                  id:
                    rule.id,

                  ruleName:
                    rule.ruleName,

                  operation:
                    rule.operation,

                  category:
                    rule.category,

                  calculatedAmount:
                    Number(
                      rule.calculatedAmount,
                    ),
                }),
              ),
          }),
        ),
    });

  const missingFinanceReportInsights =
    buildMissingFinanceReportInsights({
      properties,

      bookings:
        previousMonthBookings.map(
          (booking) => ({
            id:
              booking.id,

            propertyId:
              booking.propertyId,

            checkIn:
              booking.checkIn,

            grossAmount:
              Number(
                booking.grossAmount,
              ),
          }),
        ),

      reports:
        previousMonthReports,

      now,
    });

  /*
   * Revenue Intelligence V4
   *
   * Orizzonte corto e operativo:
   * oggi + prossimi 6 giorni.
   */
  const revenueStartDate =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
      ),
    );

  const revenueEndDate =
    new Date(
      revenueStartDate,
    );

  revenueEndDate.setUTCDate(
    revenueEndDate.getUTCDate() +
      6,
  );

  const revenueInsights =
    (
      await Promise.all(
        properties
          .filter(
            (property) =>
              property.status ===
              "ACTIVE",
          )
          .map(
            (property) =>
              getPropertyRevenueIntelligence({
                propertyId:
                  property.id,

                startDate:
                  revenueStartDate,

                endDate:
                  revenueEndDate,
              }),
          ),
      )
    ).flat();

  const insights = [
    ...taskInsights,
    ...documentInsights,
    ...financeInsights,
    ...missingFinanceReportInsights,
  ];

  return buildIntelligenceBriefing({
    propertyCount:
      properties.length,

    insights,

    now,
  });
}
