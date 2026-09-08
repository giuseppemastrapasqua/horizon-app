import {
  buildCommissionInvoicePdf,
  type CommissionInvoicePdfInput,
} from "@/lib/pdf/commission-invoice";
import { resolveBillingIssuerLogo } from "@/lib/invoices/resolve-billing-issuer-logo";
import { prisma } from "@/lib/prisma";
import { requirePropertyAccess } from "@/lib/auth/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  const { invoiceId } = await context.params;
  const normalizedInvoiceId = invoiceId.trim();

  if (!normalizedInvoiceId) {
    return new Response("Identificativo fattura non valido.", {
      status: 400,
    });
  }

  const invoice = await prisma.document.findUnique({
    where: {
      id: normalizedInvoiceId,
    },
    select: {
      id: true,
      type: true,
      status: true,
      documentNumber: true,
      propertyId: true,
      referenceMonth: true,
      content: true,
    },
  });

  if (!invoice) {
    return new Response("Fattura non trovata.", {
      status: 404,
    });
  }

  if (invoice.type !== "COMMISSION_INVOICE") {
    return new Response("Documento non valido per questa route.", {
      status: 400,
    });
  }

  if (!invoice.propertyId) {
    return new Response("Fattura senza struttura associata.", {
      status: 400,
    });
  }

  await requirePropertyAccess(invoice.propertyId);

  const snapshot = parseSnapshot(invoice.content);

  if (!snapshot) {
    return new Response("Snapshot fattura non valido.", {
      status: 422,
    });
  }

  const issuerLogo = await resolveBillingIssuerLogo(
    snapshot.issuer.logoPath,
  );

  const pdfInput: CommissionInvoicePdfInput = {
    status: invoice.status,
    documentNumber: invoice.documentNumber,
    referenceMonth:
      snapshot.source.referenceMonth ??
      invoice.referenceMonth?.toISOString() ??
      "",
    issuerLogo,
    horizonContact: {
      email: extractEmailAddress(process.env.HORIZON_EMAIL_FROM),
      marketingUrl: process.env.HORIZON_MARKETING_URL?.trim() || null,
    },
    property: snapshot.property,
    issuer: snapshot.issuer,
    recipient: snapshot.recipient,
    commission: snapshot.commission,
  };

  const pdfBytes = await buildCommissionInvoicePdf(pdfInput);

  const filename = createPdfFilename({
    propertyName: snapshot.property.name,
    referenceMonth: pdfInput.referenceMonth,
  });

  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

type InvoiceSnapshot = {
  source: {
    financeReportId: string;
    referenceMonth: string;
  };
  property: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
  };
  issuer: CommissionInvoicePdfInput["issuer"];
  recipient: CommissionInvoicePdfInput["recipient"];
  commission: CommissionInvoicePdfInput["commission"];
};

function parseSnapshot(value: unknown): InvoiceSnapshot | null {
  if (!isRecord(value)) {
    return null;
  }

  const source = value.source;
  const property = value.property;
  const issuer = value.issuer;
  const recipient = value.recipient;
  const commission = value.commission;

  if (
    !isRecord(source) ||
    !isRecord(property) ||
    !isRecord(issuer) ||
    !isRecord(recipient) ||
    !isRecord(commission)
  ) {
    return null;
  }

  const financeReportId = asString(source.financeReportId);
  const referenceMonth = asString(source.referenceMonth);
  const propertyId = asString(property.id);
  const propertyName = asString(property.name);
  const issuerBusinessName = asString(issuer.businessName);
  const issuerVatNumber = asString(issuer.vatNumber);
  const issuerAddress = asString(issuer.address);
  const issuerPostalCode = asString(issuer.postalCode);
  const issuerCity = asString(issuer.city);
  const issuerCountry = asString(issuer.country);
  const issuerEmail = asString(issuer.email);
  const recipientEntityType = asString(recipient.entityType);
  const recipientAddress = asString(recipient.address);
  const recipientPostalCode = asString(recipient.postalCode);
  const recipientCity = asString(recipient.city);
  const recipientCountry = asString(recipient.country);
  const recipientEmail = asString(recipient.email);
  const percent = asNumber(commission.percent);
  const vatPercent = asNumber(commission.vatPercent);
  const vatMode = asString(commission.vatMode);
  const taxableBase = asNumber(commission.taxableBase);
  const vat = asNumber(commission.vat);
  const total = asNumber(commission.total);
  const currency = asString(commission.currency);

  if (
    !financeReportId ||
    !referenceMonth ||
    !propertyId ||
    !propertyName ||
    !issuerBusinessName ||
    !issuerVatNumber ||
    !issuerAddress ||
    !issuerPostalCode ||
    !issuerCity ||
    !issuerCountry ||
    !issuerEmail ||
    !recipientEntityType ||
    !recipientAddress ||
    !recipientPostalCode ||
    !recipientCity ||
    !recipientCountry ||
    !recipientEmail ||
    percent === null ||
    vatPercent === null ||
    !vatMode ||
    taxableBase === null ||
    vat === null ||
    total === null ||
    !currency
  ) {
    return null;
  }

  return {
    source: {
      financeReportId,
      referenceMonth,
    },
    property: {
      id: propertyId,
      name: propertyName,
      address: asNullableString(property.address),
      city: asNullableString(property.city),
    },
    issuer: {
      businessName: issuerBusinessName,
      vatNumber: issuerVatNumber,
      taxCode: asNullableString(issuer.taxCode),
      address: issuerAddress,
      postalCode: issuerPostalCode,
      city: issuerCity,
      province: asNullableString(issuer.province),
      country: issuerCountry,
      email: issuerEmail,
      pec: asNullableString(issuer.pec),
      logoPath: asNullableString(issuer.logoPath),
    },
    recipient: {
      entityType: recipientEntityType,
      firstName: asNullableString(recipient.firstName),
      lastName: asNullableString(recipient.lastName),
      businessName: asNullableString(recipient.businessName),
      taxCode: asNullableString(recipient.taxCode),
      vatNumber: asNullableString(recipient.vatNumber),
      address: recipientAddress,
      postalCode: recipientPostalCode,
      city: recipientCity,
      province: asNullableString(recipient.province),
      country: recipientCountry,
      email: recipientEmail,
      pec: asNullableString(recipient.pec),
      recipientCode: asNullableString(recipient.recipientCode),
    },
    commission: {
      percent,
      vatPercent,
      vatMode,
      taxableBase,
      vat,
      total,
      currency,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function asNullableString(value: unknown) {
  return typeof value === "string" && value.trim()
    ? value.trim()
    : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : null;
}

function createPdfFilename({
  propertyName,
  referenceMonth,
}: {
  propertyName: string;
  referenceMonth: string;
}) {
  const date = new Date(referenceMonth);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  const safePropertyName = propertyName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `fattura-commissioni-${safePropertyName || "immobile"}-${year}-${month}.pdf`;
}

function extractEmailAddress(value: string | undefined) {
  if (!value?.trim()) return null;
  const match = value.match(/<([^<>@\s]+@[^<>@\s]+)>/);
  return (match?.[1] ?? value).trim();
}
