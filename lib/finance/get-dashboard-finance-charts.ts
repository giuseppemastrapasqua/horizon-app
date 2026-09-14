import { prisma } from "@/lib/prisma";

const MONTHS = 12;

type DashboardPropertyRef = {
  id: string;
  name: string;
  city: string;
  zone?: string | null;
};

export async function getDashboardFinanceCharts(
  properties: DashboardPropertyRef[],
) {
  const now = new Date();

  const firstMonth = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() - (MONTHS - 1),
      1,
    ),
  );

  const previousPeriodStart = new Date(
    Date.UTC(
      firstMonth.getUTCFullYear(),
      firstMonth.getUTCMonth() - MONTHS,
      1,
    ),
  );

  const nextMonth = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      1,
    ),
  );

  const propertyIds =
    properties.map(
      (property) => property.id,
    );

  const [reports, bookings] =
    await Promise.all([
      prisma.financeReport.findMany({
        where: {
          propertyId: {
            in: propertyIds,
          },
          referenceMonth: {
            gte: previousPeriodStart,
            lt: nextMonth,
          },
        },
        select: {
          propertyId: true,
          referenceMonth: true,
          grossRevenue: true,
          finalAmount: true,
        },
        orderBy: {
          referenceMonth: "asc",
        },
      }),

      prisma.booking.findMany({
        where: {
          propertyId: {
            in: propertyIds,
          },
          bookingStatus: {
            not: "CANCELLED",
          },
          checkIn: {
            gte: firstMonth,
            lt: nextMonth,
          },
        },
        select: {
          channel: true,
          grossAmount: true,
        },
      }),
    ]);

  const monthMap = new Map<
    string,
    {
      grossRevenue: number;
      netProperty: number;
    }
  >();

  for (const report of reports) {
    if (
      report.referenceMonth <
      firstMonth
    ) {
      continue;
    }

    const key =
      createMonthKey(
        report.referenceMonth,
      );

    const current =
      monthMap.get(key) ?? {
        grossRevenue: 0,
        netProperty: 0,
      };

    current.grossRevenue +=
      Number(report.grossRevenue);

    current.netProperty +=
      Number(report.finalAmount);

    monthMap.set(key, current);
  }

  const trend = Array.from(
    {
      length: MONTHS,
    },
    (_, index) => {
      const date = new Date(
        Date.UTC(
          firstMonth.getUTCFullYear(),
          firstMonth.getUTCMonth() + index,
          1,
        ),
      );

      const values =
        monthMap.get(
          createMonthKey(date),
        ) ?? {
          grossRevenue: 0,
          netProperty: 0,
        };

      return {
        key: createMonthKey(date),

        label:
          new Intl.DateTimeFormat(
            "it-IT",
            {
              month: "short",
              timeZone: "UTC",
            },
          ).format(date),

        grossRevenue:
          roundMoney(
            values.grossRevenue,
          ),

        netProperty:
          roundMoney(
            values.netProperty,
          ),
      };
    },
  );

  const channelMap =
    new Map<string, number>();

  for (const booking of bookings) {
    const channel =
      String(booking.channel);

    channelMap.set(
      channel,
      (channelMap.get(channel) ?? 0) +
        Number(booking.grossAmount),
    );
  }

  const channels =
    Array.from(
      channelMap.entries(),
    )
      .map(
        ([channel, revenue]) => ({
          channel,
          revenue:
            roundMoney(revenue),
        }),
      )
      .sort(
        (a, b) =>
          b.revenue - a.revenue,
      );

  const performance =
    properties.map((property) => {
      const currentReports =
        reports.filter(
          (report) =>
            report.propertyId ===
              property.id &&
            report.referenceMonth >=
              firstMonth,
        );

      const previousReports =
        reports.filter(
          (report) =>
            report.propertyId ===
              property.id &&
            report.referenceMonth >=
              previousPeriodStart &&
            report.referenceMonth <
              firstMonth,
        );

      const grossRevenue =
        currentReports.reduce(
          (total, report) =>
            total +
            Number(
              report.grossRevenue,
            ),
          0,
        );

      const netProperty =
        currentReports.reduce(
          (total, report) =>
            total +
            Number(
              report.finalAmount,
            ),
          0,
        );

      const previousGrossRevenue =
        previousReports.reduce(
          (total, report) =>
            total +
            Number(
              report.grossRevenue,
            ),
          0,
        );

      const changePercent =
        previousGrossRevenue > 0
          ? ((grossRevenue -
                previousGrossRevenue) /
              previousGrossRevenue) *
            100
          : null;

      return {
        id: property.id,
        name: property.name,
        city: property.city,
        zone:
          property.zone ?? null,
        grossRevenue:
          roundMoney(
            grossRevenue,
          ),
        netProperty:
          roundMoney(
            netProperty,
          ),
        changePercent:
          changePercent === null
            ? null
            : Math.round(
                changePercent * 10,
              ) / 10,
      };
    })
      .sort(
        (a, b) =>
          b.grossRevenue -
          a.grossRevenue,
      );

  return {
    trend,
    channels,
    performance,
  };
}

function createMonthKey(
  date: Date,
) {
  return [
    date.getUTCFullYear(),
    String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0"),
  ].join("-");
}

function roundMoney(
  value: number,
) {
  return (
    Math.round(
      (value +
        Number.EPSILON) *
        100,
    ) / 100
  );
}

export type DashboardFinanceCharts =
  Awaited<
    ReturnType<
      typeof getDashboardFinanceCharts
    >
  >;
