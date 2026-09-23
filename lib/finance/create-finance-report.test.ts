import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommissionInvoicePrerequisiteError } from "@/lib/invoices/commission-invoice-errors";

const buildFinancePreviewMock = vi.hoisted(() => vi.fn());
const getPropertyOtaCommissionByChannelMock = vi.hoisted(() => vi.fn());
const propertyFindUniqueMock = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());
const financeReportCreateMock = vi.hoisted(() => vi.fn());
const auditLogMock = vi.hoisted(() => vi.fn());
const upsertCommissionInvoiceDraftMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/finance/preview", () => ({
  buildFinancePreview: buildFinancePreviewMock,
}));

vi.mock("@/lib/finance/get-property-ota-commissions", () => ({
  getPropertyOtaCommissionByChannel: getPropertyOtaCommissionByChannelMock,
  resolveOtaCommissionPercent: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: {
      findUnique: propertyFindUniqueMock,
    },
    $transaction: transactionMock,
  },
}));

vi.mock("@/services/audit/AuditService", () => ({
  AuditService: {
    log: auditLogMock,
  },
}));

vi.mock("@/lib/invoices/upsert-commission-invoice-draft", () => ({
  upsertCommissionInvoiceDraft: upsertCommissionInvoiceDraftMock,
}));

import { createFinanceReport } from "./create-finance-report";

const referenceMonth = new Date("2026-09-01T00:00:00.000Z");

const report = {
  id: "report-1",
  propertyId: "property-1",
  ownerId: "owner-1",
  formulaId: null,
  createdById: null,
  referenceMonth,
  title: "Rendiconto Test property · Settembre 2026",
  currency: "EUR",
  grossRevenue: 0,
  finalAmount: 0,
  formulaName: "Horizon Standard",
  rules: [],
};

describe("createFinanceReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    buildFinancePreviewMock.mockResolvedValue({
      property: {
        id: "property-1",
        name: "Test property",
        address: "Via Test 1",
        city: "Test",
        zone: null,
        cleaningCost: 0,
        owner: {
          id: "owner-1",
          fullName: "Test Owner",
          email: "owner@example.com",
        },
        bookings: [],
      },
      owner: {
        id: "owner-1",
        fullName: "Test Owner",
        email: "owner@example.com",
      },
      bookings: [],
      formula: null,
      referenceMonth,
      nextMonthStart: new Date("2026-10-01T00:00:00.000Z"),
      grossRevenue: 0,
      totalNights: 0,
      currency: "EUR",
      calculation: null,
    });

    propertyFindUniqueMock.mockResolvedValue({
      cleaningCost: 0,
      propertyManagementCommissionPercent: 20,
      propertyManagementCommissionVatPercent: 0,
      propertyManagementCommissionVatMode: "NONE",
    });

    getPropertyOtaCommissionByChannelMock.mockResolvedValue(new Map());

    financeReportCreateMock.mockResolvedValue(report);

    transactionMock.mockImplementation(async (callback) =>
      callback({
        financeReportRule: {
          deleteMany: vi.fn(),
        },
        financeReport: {
          create: financeReportCreateMock,
          update: vi.fn(),
        },
      }),
    );

    auditLogMock.mockResolvedValue(undefined);
  });

  it("mantiene valido il rendiconto quando manca un prerequisito fiscale della fattura", async () => {
    upsertCommissionInvoiceDraftMock.mockRejectedValue(
      new CommissionInvoicePrerequisiteError({
        code: "OWNER_BILLING_PROFILE_MISSING",
        message: "Profilo fiscale del proprietario non configurato.",
      }),
    );

    await expect(
      createFinanceReport({
        propertyId: "property-1",
        referenceMonth,
      }),
    ).resolves.toMatchObject({
      id: "report-1",
      propertyId: "property-1",
    });

    expect(upsertCommissionInvoiceDraftMock).toHaveBeenCalledOnce();
  });

  it("propaga gli errori inattesi della generazione fattura", async () => {
    upsertCommissionInvoiceDraftMock.mockRejectedValue(
      new Error("Errore database inatteso."),
    );

    await expect(
      createFinanceReport({
        propertyId: "property-1",
        referenceMonth,
      }),
    ).rejects.toThrow("Errore database inatteso.");
  });
});
