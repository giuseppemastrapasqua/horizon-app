import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const requirePropertyRoleMock = vi.hoisted(() => vi.fn());
const getPropertyRevenueAnalysisMock = vi.hoisted(() => vi.fn());

const overrideFindManyMock = vi.hoisted(() => vi.fn());
const overrideDeleteMock = vi.hoisted(() => vi.fn());
const overrideCreateMock = vi.hoisted(() => vi.fn());

const transactionMock = vi.hoisted(() =>
  vi.fn(async (callback) =>
    callback({
      propertyPriceOverride: {
        findMany: overrideFindManyMock,
        delete: overrideDeleteMock,
        create: overrideCreateMock,
      },
    }),
  ),
);

const revalidatePathMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/guards", () => ({
  requirePropertyRole: requirePropertyRoleMock,
}));

vi.mock("@/lib/revenue/get-property-revenue-analysis", () => ({
  getPropertyRevenueAnalysis: getPropertyRevenueAnalysisMock,
}));

vi.mock("@/lib/job/enqueue-background-job", () => ({
  enqueueBackgroundJob: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,

    propertyPriceOverride: {
      findMany: overrideFindManyMock,
      delete: overrideDeleteMock,
      create: overrideCreateMock,
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

import { applyRevenueRecommendationAction } from "./actions";

function createFormData(
  from = "2026-09-03",
  to = "2026-09-05",
) {
  const formData = new FormData();

  formData.set("propertyId", "property-1");
  formData.set("month", "2026-09");
  formData.set("from", from);
  formData.set("to", to);

  return formData;
}

function calendarDate(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

describe("applyRevenueRecommendationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    requirePropertyRoleMock.mockResolvedValue(undefined);

    overrideFindManyMock.mockResolvedValue([]);
    overrideDeleteMock.mockResolvedValue({});
    overrideCreateMock.mockResolvedValue({});

    getPropertyRevenueAnalysisMock.mockResolvedValue({
      recommendation: {
        minimumStay: 2,

        dailyPrices: [
          {
            date: "2026-09-03",
            recommendedPrice: 174,
          },
          {
            date: "2026-09-04",
            recommendedPrice: 181,
          },
          {
            date: "2026-09-05",
            recommendedPrice: 189,
          },
        ],
      },
    });
  });

  it("applica ogni prezzo Revenue AI come override giornaliero AI", async () => {
    await applyRevenueRecommendationAction(
      createFormData(),
    );

    expect(requirePropertyRoleMock).toHaveBeenCalledWith(
      "property-1",
      ["OWNER", "MANAGER"],
    );

    expect(getPropertyRevenueAnalysisMock).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: "property-1",
        startDate: expect.any(Date),
        endDate: expect.any(Date),
      }),
    );

    expect(overrideCreateMock).toHaveBeenCalledTimes(3);

    const created =
      overrideCreateMock.mock.calls.map(
        ([argument]) => argument.data,
      );

    expect(
      created.map((item) => ({
        price: item.nightlyPrice,
        source: item.source,
        minimumStay: item.minimumStay,
        note: item.note,
      })),
    ).toEqual([
      {
        price: 174,
        source: "AI",
        minimumStay: 2,
        note: "Revenue AI Horizon",
      },
      {
        price: 181,
        source: "AI",
        minimumStay: 2,
        note: "Revenue AI Horizon",
      },
      {
        price: 189,
        source: "AI",
        minimumStay: 2,
        note: "Revenue AI Horizon",
      },
    ]);

    for (const item of created) {
      expect(item.startDate).toEqual(item.endDate);
    }
  });

  it("rimuove sia gli override AI sia MANUAL nel periodo", async () => {
    await applyRevenueRecommendationAction(
      createFormData(),
    );

    expect(overrideFindManyMock).toHaveBeenCalledTimes(2);

    const sources =
      overrideFindManyMock.mock.calls.map(
        ([argument]) => argument.where.source,
      );

    expect(sources).toEqual([
      "AI",
      "MANUAL",
    ]);

    for (const [argument] of overrideFindManyMock.mock.calls) {
      expect(argument.where).toEqual(
        expect.objectContaining({
          propertyId: "property-1",
          startDate: {
            lte: expect.any(Date),
          },
          endDate: {
            gte: expect.any(Date),
          },
        }),
      );
    }
  });

  it("preserva le parti MANUAL esterne al periodo Revenue AI", async () => {
    overrideFindManyMock.mockImplementation(
      async ({ where }) => {
        if (where.source === "AI") {
          return [];
        }

        return [
          {
            id: "manual-1",
            startDate: new Date(2026, 8, 1),
            endDate: new Date(2026, 8, 10),
            nightlyPrice: 220,
            minimumStay: 3,
            maximumStay: null,
            occupancyIncluded: null,
            source: "MANUAL",
            createdById: null,
            note: "Override manuale",
          },
        ];
      },
    );

    await applyRevenueRecommendationAction(
      createFormData(),
    );

    expect(overrideDeleteMock).toHaveBeenCalledWith({
      where: {
        id: "manual-1",
      },
    });

    const created =
      overrideCreateMock.mock.calls.map(
        ([argument]) => argument.data,
      );

    const manualSegments =
      created.filter(
        (item) => item.source === "MANUAL",
      );

    expect(manualSegments).toHaveLength(2);

    expect(
      calendarDate(manualSegments[0].startDate),
    ).toBe("2026-09-01");

    expect(
      calendarDate(manualSegments[0].endDate),
    ).toBe("2026-09-02");

    expect(
      calendarDate(manualSegments[1].startDate),
    ).toBe("2026-09-06");

    expect(
      calendarDate(manualSegments[1].endDate),
    ).toBe("2026-09-10");

    expect(
      manualSegments.every(
        (item) =>
          item.nightlyPrice === 220 &&
          item.minimumStay === 3,
      ),
    ).toBe(true);
  });

  it("non modifica il calendario se manca una raccomandazione Revenue AI", async () => {
    getPropertyRevenueAnalysisMock.mockResolvedValue(null);

    await expect(
      applyRevenueRecommendationAction(
        createFormData(),
      ),
    ).rejects.toThrow(
      "Nessuna raccomandazione Revenue AI disponibile.",
    );

    expect(transactionMock).not.toHaveBeenCalled();
    expect(overrideCreateMock).not.toHaveBeenCalled();
  });
});
