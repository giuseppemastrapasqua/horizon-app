import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  calculatePropertyFinanceFormula,
} from "@/lib/finance/calculate-property-finance-formula";

import {
  buildBookingFinanceBreakdown,
} from "./build-booking-finance-breakdown";

vi.mock(
  "@/lib/finance/calculate-property-finance-formula",
  () => ({
    calculatePropertyFinanceFormula: vi.fn(),
  }),
);

const mockedCalculatePropertyFinanceFormula = vi.mocked(
  calculatePropertyFinanceFormula,
);

const baseInput = {
  formulaId: "formula-duomo",
  grossRevenue: 780,
  cleaningCost: 70,
  otaCommissionPercent: 24.5,
  propertyManagementCommissionPercent: 20,
  currency: "EUR",
  channel: "BOOKING" as const,
};

describe("buildBookingFinanceBreakdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockedCalculatePropertyFinanceFormula.mockResolvedValue({
      formulaId: "formula-duomo",
      formulaName: "Duomo Finance",
      grossRevenue: 780,
      finalAmount: 780,
      currency: "EUR",
      rules: [],
    });
  });

  it("mantiene il calcolo storico di OTA, pulizie, PM, F24 e bonifico", async () => {
    const result = await buildBookingFinanceBreakdown(baseInput);

    expect(result.grossBooking).toBeCloseTo(780, 2);
    expect(result.otaCommission).toBeCloseTo(191.1, 2);
    expect(result.cleaningCost).toBeCloseTo(70, 2);
    expect(result.grossProperty).toBeCloseTo(518.9, 2);
    expect(result.managementCommission).toBeCloseTo(103.78, 2);
    expect(result.taxAmount).toBeCloseTo(87.1752, 4);
    expect(result.netProperty).toBeCloseTo(327.9448, 4);
  });

  it("NONE mantiene la commissione PM senza IVA", async () => {
    const result = await buildBookingFinanceBreakdown({
      ...baseInput,
      propertyManagementCommissionVatPercent: 22,
      propertyManagementCommissionVatMode: "NONE",
    });

    expect(result.managementCommissionTaxableBase).toBeCloseTo(103.78, 4);
    expect(result.managementCommissionVat).toBeCloseTo(0, 4);
    expect(result.managementCommissionTotal).toBeCloseTo(103.78, 4);
    expect(result.taxAmount).toBeCloseTo(87.1752, 4);
    expect(result.netProperty).toBeCloseTo(327.9448, 4);
  });

  it("EXCLUDED aggiunge IVA alla commissione PM", async () => {
    const result = await buildBookingFinanceBreakdown({
      ...baseInput,
      propertyManagementCommissionVatPercent: 22,
      propertyManagementCommissionVatMode: "EXCLUDED",
    });

    expect(result.managementCommissionTaxableBase).toBeCloseTo(103.78, 4);
    expect(result.managementCommissionVat).toBeCloseTo(22.8316, 4);
    expect(result.managementCommissionTotal).toBeCloseTo(126.6116, 4);
    expect(result.taxAmount).toBeCloseTo(82.380564, 6);
    expect(result.netProperty).toBeCloseTo(309.907836, 6);
  });

  it("INCLUDED scorpora IVA dalla commissione PM totale", async () => {
    const result = await buildBookingFinanceBreakdown({
      ...baseInput,
      propertyManagementCommissionVatPercent: 22,
      propertyManagementCommissionVatMode: "INCLUDED",
    });

    expect(result.managementCommissionTaxableBase).toBeCloseTo(85.0656, 4);
    expect(result.managementCommissionVat).toBeCloseTo(18.7144, 4);
    expect(result.managementCommissionTotal).toBeCloseTo(103.78, 4);
    expect(result.taxAmount).toBeCloseTo(87.1752, 4);
    expect(result.netProperty).toBeCloseTo(327.9448, 4);
  });
});
