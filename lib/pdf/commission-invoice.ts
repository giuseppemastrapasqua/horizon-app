import { HORIZON_LOGO_BASE64 } from "./horizon-logo-data";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

export type CommissionInvoicePdfInput = {
  status: string;
  documentNumber: string | null;
  referenceMonth: string;
  issuerLogo: {
    data: Uint8Array;
    contentType: "image/png" | "image/jpeg";
  } | null;
  horizonContact: {
    email: string | null;
    marketingUrl: string | null;
  };
  property: {
    name: string;
    address: string | null;
    city: string | null;
  };
  issuer: {
    businessName: string;
    vatNumber: string;
    taxCode: string | null;
    address: string;
    postalCode: string;
    city: string;
    province: string | null;
    country: string;
    email: string;
    pec: string | null;
    logoPath: string | null;
  };
  recipient: {
    entityType: string;
    firstName: string | null;
    lastName: string | null;
    businessName: string | null;
    taxCode: string | null;
    vatNumber: string | null;
    address: string;
    postalCode: string;
    city: string;
    province: string | null;
    country: string;
    email: string;
    pec: string | null;
    recipientCode: string | null;
  };
  commission: {
    percent: number;
    vatPercent: number;
    vatMode: string;
    taxableBase: number;
    vat: number;
    total: number;
    currency: string;
  };
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

export async function buildCommissionInvoicePdf(
  input: CommissionInvoicePdfInput
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const issuerLogo = await loadIssuerLogo(pdf, input.issuerLogo);
  const horizonLogo = await loadLogo(pdf);

  drawHeader(page, font, bold, issuerLogo, input);
  drawParties(page, font, bold, input);
  drawCommission(page, font, bold, input);
  drawFooter(page, font, bold, horizonLogo, input);

  return pdf.save();
}

async function loadIssuerLogo(
  pdf: PDFDocument,
  logo: CommissionInvoicePdfInput["issuerLogo"],
): Promise<PDFImage | null> {
  if (!logo) return null;

  try {
    return logo.contentType === "image/png"
      ? await pdf.embedPng(logo.data)
      : await pdf.embedJpg(logo.data);
  } catch {
    return null;
  }
}

async function loadLogo(pdf: PDFDocument): Promise<PDFImage | null> {
  try {
    return await pdf.embedPng(Buffer.from(HORIZON_LOGO_BASE64, "base64"));
  } catch {
    return null;
  }
}

function drawHeader(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  logo: PDFImage | null,
  input: CommissionInvoicePdfInput
) {
  if (logo) {
    const scale = Math.min(210 / logo.width, 68 / logo.height);
    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE_HEIGHT - 82,
      width: logo.width * scale,
      height: logo.height * scale,
    });
  } else {
    page.drawText(safe(input.issuer.businessName), {
      x: MARGIN,
      y: PAGE_HEIGHT - 62,
      font: bold,
    });
  }

  page.drawText("COPIA FATTURA COMMISSIONI", {
    x: 300,
    y: PAGE_HEIGHT - 58,
    size: 15,
    font: bold,
  });

  page.drawText(
    input.status === "ISSUED"
      ? `Stato: EMESSA${input.documentNumber ? ` - N. ${safe(input.documentNumber)}` : ""}`
      : "COPIA DI CORTESIA - NON FISCALMENTE EMESSA",
    {
      x: MARGIN,
      y: PAGE_HEIGHT - 112,
      size: input.status === "ISSUED" ? 10 : 11,
      font: bold,
      color:
        input.status === "ISSUED"
          ? rgb(0.1, 0.45, 0.2)
          : rgb(0.75, 0.15, 0.12),
    }
  );

  page.drawText(`Periodo: ${formatMonth(input.referenceMonth)}`, {
    x: MARGIN,
    y: PAGE_HEIGHT - 132,
    size: 10,
    font,
  });

  page.drawText(`Struttura: ${safe(input.property.name)}`, {
    x: MARGIN,
    y: PAGE_HEIGHT - 148,
    size: 10,
    font,
  });
}

function drawParties(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  input: CommissionInvoicePdfInput
) {
  drawBox(page, MARGIN, 500, 238, 145);
  drawBox(page, 309, 500, 238, 145);

  page.drawText("EMITTENTE", {
    x: MARGIN + 12,
    y: 624,
    size: 10,
    font: bold,
  });
  page.drawText("DESTINATARIO", {
    x: 321,
    y: 624,
    size: 10,
    font: bold,
  });

  const issuerLines = [
    input.issuer.businessName,
    `P.IVA: ${input.issuer.vatNumber}`,
    input.issuer.taxCode ? `C.F.: ${input.issuer.taxCode}` : null,
    input.issuer.address,
    `${input.issuer.postalCode} ${input.issuer.city}${
      input.issuer.province ? ` (${input.issuer.province})` : ""
    }`,
    input.issuer.email,
    input.issuer.pec ? `PEC: ${input.issuer.pec}` : null,
  ].filter(Boolean) as string[];

  const recipientName =
    input.recipient.businessName ||
    [input.recipient.firstName, input.recipient.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Proprietario";

  const recipientLines = [
    recipientName,
    input.recipient.vatNumber
      ? `P.IVA: ${input.recipient.vatNumber}`
      : null,
    input.recipient.taxCode ? `C.F.: ${input.recipient.taxCode}` : null,
    input.recipient.address,
    `${input.recipient.postalCode} ${input.recipient.city}${
      input.recipient.province ? ` (${input.recipient.province})` : ""
    }`,
    input.recipient.email,
    input.recipient.pec ? `PEC: ${input.recipient.pec}` : null,
    input.recipient.recipientCode
      ? `SDI: ${input.recipient.recipientCode}`
      : null,
  ].filter(Boolean) as string[];

  drawLines(page, issuerLines, MARGIN + 12, 604, font);
  drawLines(page, recipientLines, 321, 604, font);
}

function drawCommission(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  input: CommissionInvoicePdfInput
) {
  page.drawText("DETTAGLIO COMMISSIONI", {
    x: MARGIN,
    y: 460,
    size: 12,
    font: bold,
  });

  const rows = [
    [
      "Commissione Property Manager",
      formatPercent(input.commission.percent),
    ],
    [
      "Imponibile",
      money(input.commission.taxableBase, input.commission.currency),
    ],
    [
      `IVA ${formatPercent(input.commission.vatPercent)}`,
      money(input.commission.vat, input.commission.currency),
    ],
  ];

  let y = 430;

  for (const [label, value] of rows) {
    page.drawText(label, {
      x: MARGIN,
      y,
      size: 10,
      font,
    });
    drawRight(page, value, 547, y, font, 10);
    y -= 28;
  }

  page.drawLine({
    start: { x: MARGIN, y: y + 8 },
    end: { x: 547, y: y + 8 },
    thickness: 1,
    color: rgb(0.82, 0.82, 0.82),
  });

  page.drawText("TOTALE", {
    x: MARGIN,
    y: y - 15,
    size: 14,
    font: bold,
  });

  drawRight(
    page,
    money(input.commission.total, input.commission.currency),
    547,
    y - 15,
    bold,
    14
  );

  page.drawText(
    `Modalita IVA PM: ${safe(input.commission.vatMode)}`,
    {
      x: MARGIN,
      y: y - 48,
      size: 8,
      font,
      color: rgb(0.35, 0.35, 0.35),
    }
  );
}

function drawFooter(
  page: PDFPage,
  font: PDFFont,
  bold: PDFFont,
  horizonLogo: PDFImage | null,
  input: CommissionInvoicePdfInput
) {
  const text =
    input.status === "ISSUED"
      ? "Copia archiviata in Horizon. I dati fiscali di emissione fanno riferimento al documento ufficiale."
      : "Copia generata da Horizon. La fattura fiscale sara emessa dal provider di fatturazione e acquisita successivamente in Horizon.";

  page.drawText(text, {
    x: MARGIN,
    y: 72,
    size: 7.5,
    font: input.status === "ISSUED" ? font : bold,
    color: rgb(0.35, 0.35, 0.35),
    maxWidth: PAGE_WIDTH - MARGIN * 2,
    lineHeight: 10,
  });

  page.drawLine({
    start: { x: MARGIN, y: 52 },
    end: { x: PAGE_WIDTH - MARGIN, y: 52 },
    thickness: 0.6,
    color: rgb(0.86, 0.86, 0.86),
  });

  let contactX = MARGIN;

  if (horizonLogo) {
    const scale = Math.min(
      72 / horizonLogo.width,
      20 / horizonLogo.height,
    );

    page.drawImage(horizonLogo, {
      x: MARGIN,
      y: 22,
      width: horizonLogo.width * scale,
      height: horizonLogo.height * scale,
    });

    contactX = MARGIN + horizonLogo.width * scale + 14;
  } else {
    page.drawText("HORIZON", {
      x: MARGIN,
      y: 27,
      size: 8,
      font: bold,
    });
    contactX = MARGIN + 62;
  }

  const contacts = [
    input.horizonContact.email,
    input.horizonContact.marketingUrl,
  ].filter(Boolean) as string[];

  if (contacts.length > 0) {
    page.drawText(safe(contacts.join("  |  ")), {
      x: contactX,
      y: 27,
      size: 7,
      font,
      color: rgb(0.45, 0.45, 0.45),
      maxWidth: PAGE_WIDTH - MARGIN - contactX,
    });
  }
}

function drawBox(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number
) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderWidth: 1,
    borderColor: rgb(0.82, 0.82, 0.82),
  });
}

function drawLines(
  page: PDFPage,
  lines: string[],
  x: number,
  startY: number,
  font: PDFFont
) {
  let y = startY;

  for (const line of lines.slice(0, 8)) {
    page.drawText(safe(line), {
      x,
      y,
      size: 8.5,
      font,
      maxWidth: 210,
    });
    y -= 15;
  }
}

function drawRight(
  page: PDFPage,
  text: string,
  xRight: number,
  y: number,
  font: PDFFont,
  size: number
) {
  const value = safe(text);
  const width = font.widthOfTextAtSize(value, size);

  page.drawText(value, {
    x: xRight - width,
    y,
    size,
    font,
  });
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: currency || "EUR",
  }).format(value);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("it-IT", {
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

function formatMonth(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("it-IT", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function safe(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");
}
