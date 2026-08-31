import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const requirePropertyAccessMock = vi.hoisted(() => vi.fn());

const propertyFindUniqueMock = vi.hoisted(() => vi.fn());
const propertyUpdateMock = vi.hoisted(() => vi.fn());
const ratePlanFindFirstMock = vi.hoisted(() => vi.fn());
const overrideDeleteManyMock = vi.hoisted(() => vi.fn());
const overrideCreateMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth/guards", () => ({
  requirePropertyAccess: requirePropertyAccessMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(async (callback) =>
      callback({
        property: {
          findUnique: propertyFindUniqueMock,
          update: propertyUpdateMock,
        },
        propertyRatePlan: {
          findFirst: ratePlanFindFirstMock,
          create: vi.fn(),
        },
        propertyPriceOverride: {
          deleteMany: overrideDeleteManyMock,
          create: overrideCreateMock,
        },
      }),
    ),
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { savePropertyPricingOverrideAction } from "./pricing-actions";

describe("savePropertyPricingOverrideAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    propertyFindUniqueMock.mockResolvedValue({
      id: "property-1",
    });

    propertyUpdateMock.mockResolvedValue({});
    ratePlanFindFirstMock.mockResolvedValue({
      id: "rate-plan-1",
    });

    overrideDeleteManyMock.mockResolvedValue({
      count: 1,
    });

    overrideCreateMock.mockResolvedValue({});
  });

  it("applica un override AI come AI", async () => {
    const formData = new FormData();

    formData.set("propertyId", "property-1");
    formData.set("source", "AI");
    formData.set("startDate", "2026-09-02");
    formData.set("endDate", "2026-09-02");
    formData.set("nightlyPrice", "174");
    formData.set("cleaningCost", "50");

    await savePropertyPricingOverrideAction(formData);

    expect(overrideCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        propertyId: "property-1",
        nightlyPrice: 174,
        source: "AI",
      }),
    });

    expect(overrideDeleteManyMock).toHaveBeenCalledWith({
      where: expect.objectContaining({
        propertyId: "property-1",
        source: "MANUAL",
      }),
    });
  });
});
