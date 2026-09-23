import {
  DocumentStatus,
  DocumentType,
  Prisma,
} from "@prisma/client";

import { CommissionInvoicePrerequisiteError } from "@/lib/invoices/commission-invoice-errors";
import { prisma } from "@/lib/prisma";

type UpsertCommissionInvoiceDraftParams = {
  reportId: string;
  managementCommissionTaxableBaseTotal: number;
  managementCommissionVatTotal: number;
  managementCommissionTotal: number;
  createdByName?: string | null;
};

export async function upsertCommissionInvoiceDraft({
  reportId,
  managementCommissionTaxableBaseTotal,
  managementCommissionVatTotal,
  managementCommissionTotal,
  createdByName = null,
}: UpsertCommissionInvoiceDraftParams) {
  const report =
    await prisma.financeReport.findUnique({
      where: {
        id: reportId,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            propertyManagementCommissionPercent:
              true,
            propertyManagementCommissionVatPercent:
              true,
            propertyManagementCommissionVatMode:
              true,
          },
        },
      },
    });

  if (!report) {
    throw new Error(
      "Rendiconto finanziario non trovato.",
    );
  }

  const [issuer, recipient] =
    await Promise.all([
      prisma.billingIssuerProfile.findUnique({
        where: {
          profileKey: "DEFAULT",
        },
      }),
      prisma.ownerBillingProfile.findUnique({
        where: {
          ownerId: report.ownerId,
        },
      }),
    ]);

  if (!issuer) {
    throw new CommissionInvoicePrerequisiteError({
      code: "ISSUER_BILLING_PROFILE_MISSING",
      message: "Profilo fiscale dell'emittente non configurato.",
    });
  }

  if (!recipient) {
    throw new CommissionInvoicePrerequisiteError({
      code: "OWNER_BILLING_PROFILE_MISSING",
      message: "Profilo fiscale del proprietario non configurato.",
    });
  }

  const referenceMonth =
    new Date(report.referenceMonth);

  const monthKey =
    `${referenceMonth.getUTCFullYear()}-${String(
      referenceMonth.getUTCMonth() + 1,
    ).padStart(2, "0")}`;

  const documentKey =
    `commission-invoice:${report.propertyId}:${monthKey}`;

  const content = {
    schemaVersion: 1,
    kind: "COMMISSION_INVOICE",
    source: {
      financeReportId: report.id,
      referenceMonth:
        referenceMonth.toISOString(),
    },
    property: {
      id: report.property.id,
      name: report.property.name,
      address: report.property.address,
      city: report.property.city,
    },
    issuer: {
      businessName: issuer.businessName,
      vatNumber: issuer.vatNumber,
      taxCode: issuer.taxCode,
      address: issuer.address,
      postalCode: issuer.postalCode,
      city: issuer.city,
      province: issuer.province,
      country: issuer.country,
      email: issuer.email,
      pec: issuer.pec,
      logoPath: issuer.logoPath,
    },
    recipient: {
      ownerId: recipient.ownerId,
      entityType: recipient.entityType,
      firstName: recipient.firstName,
      lastName: recipient.lastName,
      businessName: recipient.businessName,
      taxCode: recipient.taxCode,
      vatNumber: recipient.vatNumber,
      address: recipient.address,
      postalCode: recipient.postalCode,
      city: recipient.city,
      province: recipient.province,
      country: recipient.country,
      email: recipient.email,
      pec: recipient.pec,
      recipientCode:
        recipient.recipientCode,
    },
    commission: {
      percent: Number(
        report.property
          .propertyManagementCommissionPercent,
      ),
      vatPercent: Number(
        report.property
          .propertyManagementCommissionVatPercent,
      ),
      vatMode:
        report.property
          .propertyManagementCommissionVatMode,
      taxableBase: roundMoney(
        managementCommissionTaxableBaseTotal,
      ),
      vat: roundMoney(
        managementCommissionVatTotal,
      ),
      total: roundMoney(
        managementCommissionTotal,
      ),
      currency: report.currency,
    },
  } satisfies Prisma.InputJsonObject;

  const title =
    `Fattura commissioni ${report.property.name} - ${monthKey}`;

  return prisma.$transaction(
    async (transaction) => {
      const existing =
        await transaction.document.findUnique({
          where: {
            documentKey,
          },
        });

      if (
        existing &&
        existing.status !==
          DocumentStatus.DRAFT
      ) {
        throw new Error(
          `La fattura commissioni esiste giÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â  con stato ${existing.status} e non puÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â² essere modificata automaticamente.`,
        );
      }

      if (!existing) {
        return transaction.document.create({
          data: {
            type:
              DocumentType.COMMISSION_INVOICE,
            status:
              DocumentStatus.DRAFT,
            documentNumber: null,
            ownerId: report.ownerId,
            propertyId:
              report.propertyId,
            referenceMonth,
            title,
            subtitle:
              "Copia fattura commissioni Property Management",
            content,
            documentKey,
            currentVersion: 1,
            versions: {
              create: {
                version: 1,
                content,
                note:
                  "Prima generazione automatica dal rendiconto mensile.",
                createdByName:
                  createdByName?.trim() ||
                  null,
              },
            },
          },
          include: {
            versions: true,
          },
        });
      }

      if (normalizeJson(existing.content) === normalizeJson(content)) {
        return transaction.document.findUniqueOrThrow({
          where: {
            id: existing.id,
          },
          include: {
            versions: true,
          },
        });
      }

      const nextVersion =
        existing.currentVersion + 1;

      return transaction.document.update({
        where: {
          id: existing.id,
        },
        data: {
          ownerId: report.ownerId,
          propertyId:
            report.propertyId,
          referenceMonth,
          title,
          subtitle:
            "Copia fattura commissioni Property Management",
          content,
          currentVersion:
            nextVersion,
          versions: {
            create: {
              version: nextVersion,
              content,
              note:
                "Aggiornamento automatico dal rendiconto mensile.",
              createdByName:
                createdByName?.trim() ||
                null,
            },
          },
        },
        include: {
          versions: true,
        },
      });
    },
  );
}

function normalizeJson(value: unknown): string {
  return JSON.stringify(normalizeJsonValue(value));
}

function normalizeJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeJsonValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalizeJsonValue(item)]),
    );
  }

  return value;
}


function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
