import { HORIZON_LOGO_BASE64 } from "./horizon-logo-data";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";

export type FinanceReportPdfBooking = {
  id: string;
  guestName: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  channel: string;
  currency: string;

  grossBooking: number;

  otaCommission:
    | number
    | null;

  cleaningCost: number;

  grossProperty:
    | number
    | null;

  managementCommission:
    | number
    | null;

  taxAmount:
    | number
    | null;

  otherAmount:
    | number
    | null;

  netProperty:
    | number
    | null;
};

export type FinanceReportPdfRuleCategory =
  | "OTA_COMMISSION"
  | "VAT"
  | "CLEANING"
  | "MANAGEMENT_COMMISSION"
  | "TAX"
  | "OTHER";

export type FinanceReportPdfRule = {
  id: string;
  order: number;
  ruleName: string;
  operation: string;
  category: FinanceReportPdfRuleCategory;
  calculatedAmount: number;
};

export type FinanceReportPdfTemplate = {
  name: string;
  headerTitle: string;
  primaryColor: string;
  logoUrl: string | null;
  footerText: string | null;

  showBookingDetails: boolean;
  showOtaCommissions: boolean;
  showCleaningCosts: boolean;
  showManagementFees: boolean;
  showTaxes: boolean;
  showManualAdjustments: boolean;
  showCategorySummary: boolean;
};
export type FinanceReportPdfInput = {
  template: FinanceReportPdfTemplate;

  title: string;
  referenceMonth: Date;
  currency: string;
  grossRevenue: number;
  finalAmount: number;
  formulaName: string;
  createdAt: Date;

  adjustments: {
    id: string;
    description: string;
    amount: number;
  }[];

  property: {
    name: string;
    address: string;
    city: string;
    zone: string | null;
  };

  owner: {
    fullName: string;
    email: string | null;
    phone: string | null;
  };

  createdBy: {
    fullName: string;
  } | null;

  bookings: FinanceReportPdfBooking[];
  rules: FinanceReportPdfRule[];
};

type TableColumn = {
  key:
    | "guest"
    | "checkIn"
    | "checkOut"
    | "channel"
    | "nights"
    | "grossBooking"
    | "otaCommission"
    | "cleaning"
    | "grossProperty"
    | "managementCommission"
    | "tax"
    | "other"
    | "netProperty";

  label: string;
  width: number;

  align?:
    | "left"
    | "center"
    | "right";
};

type CategorySummaryItem = {
  category: FinanceReportPdfRuleCategory;
  label: string;
  amount: number;
};

const PAGE_WIDTH = 841.89;
const PAGE_HEIGHT = 595.28;

const PAGE_MARGIN = 24;
const CONTENT_WIDTH =
  PAGE_WIDTH - PAGE_MARGIN * 2;

const HEADER_HEIGHT = 82;
const SUMMARY_HEIGHT = 150;
const FOOTER_HEIGHT = 20;

const CATEGORY_ORDER: FinanceReportPdfRuleCategory[] =
  [
    "OTA_COMMISSION",
    "VAT",
    "CLEANING",
    "MANAGEMENT_COMMISSION",
    "TAX",
    "OTHER",
  ];

const TABLE_COLUMNS: TableColumn[] = [
  {
    key: "guest",
    label: "OSPITE",
    width: 122,
  },
  {
    key: "checkIn",
    label: "IN",
    width: 38,
    align: "center",
  },
  {
    key: "checkOut",
    label: "OUT",
    width: 38,
    align: "center",
  },
  {
    key: "channel",
    label: "OTA",
    width: 46,
    align: "center",
  },
  {
    key: "nights",
    label: "NT",
    width: 25,
    align: "center",
  },

  {
    key: "grossBooking",
    label: "LORDO",
    width: 64,
    align: "right",
  },
  {
    key: "otaCommission",
    label: "COMM. OTA",
    width: 64,
    align: "right",
  },
  {
    key: "cleaning",
    label: "PULIZIE",
    width: 58,
    align: "right",
  },
  {
    key: "grossProperty",
    label: "LORDO PROP.",
    width: 68,
    align: "right",
  },
  {
    key: "managementCommission",
    label: "COMM. PM",
    width: 62,
    align: "right",
  },
  {
    key: "tax",
    label: "CEDOLARE",
    width: 60,
    align: "right",
  },
  {
    key: "other",
    label: "VARIE",
    width: 52,
    align: "right",
  },
  {
    key: "netProperty",
    label: "NETTO PROP.",
    width: 70,
    align: "right",
  },
];

function hexToPdfRgb(
  hex: string
) {
  const normalized =
    /^#[0-9A-Fa-f]{6}$/.test(hex)
      ? hex
      : "#2563EB";

  const red =
    parseInt(
      normalized.slice(1, 3),
      16
    ) / 255;

  const green =
    parseInt(
      normalized.slice(3, 5),
      16
    ) / 255;

  const blue =
    parseInt(
      normalized.slice(5, 7),
      16
    ) / 255;

  return rgb(
    red,
    green,
    blue
  );
}

async function loadDefaultHorizonLogo(
  pdfDocument: PDFDocument
): Promise<PDFImage | null> {
  try {
    const bytes =
      Uint8Array.from(
        Buffer.from(
          HORIZON_LOGO_BASE64,
          "base64"
        )
      );

    return await pdfDocument.embedPng(
      bytes
    );
  } catch (error) {
    console.error(
      "[FINANCE PDF LOGO]",
      error
    );

    return null;
  }
}

async function loadTemplateLogo(
  pdfDocument: PDFDocument,
  logoUrl: string | null
): Promise<PDFImage | null> {
  if (!logoUrl) {
    return null;
  }

  const normalizedUrl =
    logoUrl.trim();

  if (
    !/^https?:\/\//i.test(
      normalizedUrl
    )
  ) {
    return null;
  }

  try {
    const response =
      await fetch(
        normalizedUrl,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return null;
    }

    const bytes =
      new Uint8Array(
        await response.arrayBuffer()
      );

    const contentType =
      response.headers
        .get("content-type")
        ?.toLowerCase() ??
      "";

    if (
      contentType.includes("png")
    ) {
      return await pdfDocument.embedPng(
        bytes
      );
    }

    if (
      contentType.includes("jpeg") ||
      contentType.includes("jpg")
    ) {
      return await pdfDocument.embedJpg(
        bytes
      );
    }

    try {
      return await pdfDocument.embedPng(
        bytes
      );
    } catch {
      return await pdfDocument.embedJpg(
        bytes
      );
    }
  } catch {
    return null;
  }
}

export async function buildFinanceReportPdf(
  input: FinanceReportPdfInput
): Promise<Uint8Array> {
  const pdfDocument =
    await PDFDocument.create();

  const font =
    await pdfDocument.embedFont(
      StandardFonts.Helvetica
    );

  const boldFont =
    await pdfDocument.embedFont(
      StandardFonts.HelveticaBold
    );

  const page =
    pdfDocument.addPage([
      PAGE_WIDTH,
      PAGE_HEIGHT,
    ]);

  
  
  
  const templateLogo =
    (
      await loadTemplateLogo(
        pdfDocument,
        input.template.logoUrl
      )
    ) ??
    (
      await loadDefaultHorizonLogo(
        pdfDocument
      )
    );
drawPageBackground(page);

  drawHeader({
    page,
    font,
    boldFont,
    input,
    logo: templateLogo,
  });

  const tableTop =
    PAGE_HEIGHT -
    PAGE_MARGIN -
    HEADER_HEIGHT;

  const summaryTop =
    PAGE_MARGIN +
    FOOTER_HEIGHT +
    SUMMARY_HEIGHT;

  if (input.template.showBookingDetails) {
    drawBookingsTable({
      page,
      font,
      boldFont,
      input,
      tableTop,
      tableBottom: summaryTop,
    });
  }

  drawSummary({
    page,
    font,
    boldFont,
    input,
  });

  drawFooter({
    page,
    font,
    input,
  });

  return pdfDocument.save();
}

function drawPageBackground(
  page: PDFPage
) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(1, 1, 1),
  });
}

function drawHeader({
  page,
  font,
  boldFont,
  input,
  logo,
}: {
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  input: FinanceReportPdfInput;
  logo: PDFImage | null;
}) {
  const top =
    PAGE_HEIGHT - PAGE_MARGIN;

  if (logo) {
    const maxLogoWidth = 135;
    const maxLogoHeight = 30;

    const scale =
      Math.min(
        maxLogoWidth / logo.width,
        maxLogoHeight / logo.height
      );

    page.drawImage(
      logo,
      {
        x: PAGE_MARGIN,
        y:
          top -
          logo.height * scale,
        width:
          logo.width * scale,
        height:
          logo.height * scale,
      }
    );
  } else {
    page.drawText(
      "HORIZON",
      {
        x: PAGE_MARGIN,
        y: top - 14,
        size: 12,
        font: boldFont,
        color:
          hexToPdfRgb(
            input.template.primaryColor
          ),
      }
    );
  }

  page.drawText(
    truncateText({
      text: normalizePdfText(
        input.template.headerTitle
      ),
      font: boldFont,
      size: 8,
      maxWidth: 320,
    }),
    {
      x: PAGE_MARGIN,
      y: top - 34,
      size: 8,
      font: boldFont,
      color: rgb(
        0.39,
        0.45,
        0.55
      ),
    }
  );

  page.drawText(
    truncateText({
      text: normalizePdfText(
        input.property.name
      ),
      font: boldFont,
      size: 19,
      maxWidth: 360,
    }),
    {
      x: PAGE_MARGIN,
      y: top - 57,
      size: 19,
      font: boldFont,
      color: rgb(
        0.06,
        0.09,
        0.16
      ),
    }
  );

  const monthLabel =
    formatMonth(
      input.referenceMonth
    ).toUpperCase();

  drawRightAlignedText({
    page,
    text: monthLabel,
    xRight:
      PAGE_WIDTH - PAGE_MARGIN,
    y: top - 18,
    size: 17,
    font: boldFont,
    color: rgb(
      0.06,
      0.09,
      0.16
    ),
  });

  drawRightAlignedText({
    page,
    text: normalizePdfText(
      input.owner.fullName
    ),
    xRight:
      PAGE_WIDTH - PAGE_MARGIN,
    y: top - 39,
    size: 9,
    font: boldFont,
    color: rgb(
      0.28,
      0.33,
      0.41
    ),
  });

  drawRightAlignedText({
    page,
    text: buildPropertyAddress(
      input.property
    ),
    xRight:
      PAGE_WIDTH - PAGE_MARGIN,
    y: top - 56,
    size: 8,
    font,
    color: rgb(
      0.39,
      0.45,
      0.55
    ),
    maxWidth: 370,
  });

  page.drawLine({
    start: {
      x: PAGE_MARGIN,
      y: top - 72,
    },
    end: {
      x:
        PAGE_WIDTH -
        PAGE_MARGIN,
      y: top - 72,
    },
    thickness: 1,
    color: rgb(
      0.82,
      0.86,
      0.91
    ),
  });
}

function drawBookingsTable({
  page,
  font,
  boldFont,
  input,
  tableTop,
  tableBottom,
}: {
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  input: FinanceReportPdfInput;
  tableTop: number;
  tableBottom: number;
}) {
  const headerHeight = 24;

  const availableRowsHeight =
    tableTop -
    tableBottom -
    headerHeight;

  const bookingCount =
    Math.max(
      input.bookings.length,
      1
    );

  const calculatedRowHeight =
    availableRowsHeight /
    bookingCount;

  const rowHeight =
    Math.min(
      24,
      calculatedRowHeight
    );

  const fontSize =
    getTableFontSize(rowHeight);

  page.drawRectangle({
    x: PAGE_MARGIN,
    y: tableTop - headerHeight,
    width: CONTENT_WIDTH,
    height: headerHeight,
    color: hexToPdfRgb(input.template.primaryColor),
  });

  let columnX = PAGE_MARGIN;

  for (const column of TABLE_COLUMNS) {
    drawCellText({
      page,
      text: column.label,
      x: columnX,
      y:
        tableTop -
        headerHeight,
      width: column.width,
      height: headerHeight,
      font: boldFont,
      size: 7,
      align:
        column.align ?? "left",
      color: rgb(1, 1, 1),
      padding: 6,
    });

    columnX += column.width;
  }

  if (input.bookings.length === 0) {
    const emptyRowTop =
      tableTop - headerHeight;

    page.drawRectangle({
      x: PAGE_MARGIN,
      y:
        emptyRowTop -
        Math.min(
          rowHeight,
          28
        ),
      width: CONTENT_WIDTH,
      height: Math.min(
        rowHeight,
        28
      ),
      color: rgb(
        0.97,
        0.98,
        0.99
      ),
      borderWidth: 0.5,
      borderColor: rgb(
        0.86,
        0.89,
        0.93
      ),
    });

    drawCellText({
      page,
      text:
        "Nessuna prenotazione nel mese selezionato",
      x: PAGE_MARGIN,
      y:
        emptyRowTop -
        Math.min(
          rowHeight,
          28
        ),
      width: CONTENT_WIDTH,
      height: Math.min(
        rowHeight,
        28
      ),
      font,
      size: 8,
      align: "center",
      color: rgb(
        0.39,
        0.45,
        0.55
      ),
      padding: 6,
    });

    return;
  }

  input.bookings.forEach(
    (booking, index) => {
      const rowTop =
        tableTop -
        headerHeight -
        index * rowHeight;

      const rowBottom =
        rowTop - rowHeight;

      page.drawRectangle({
        x: PAGE_MARGIN,
        y: rowBottom,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color:
          index % 2 === 0
            ? rgb(
                0.98,
                0.98,
                0.99
              )
            : rgb(1, 1, 1),
        borderWidth: 0.4,
        borderColor: rgb(
          0.88,
          0.9,
          0.94
        ),
      });

      let cellX = PAGE_MARGIN;

      for (const column of TABLE_COLUMNS) {
        drawCellText({
          page,
          text: getBookingCellValue({
            booking,
            column,
          }),
          x: cellX,
          y: rowBottom,
          width: column.width,
          height: rowHeight,
          font:
            column.key === "grossBooking"
              ? boldFont
              : font,
          size: fontSize,
          align:
            column.align ??
            "left",
          color: rgb(
            0.08,
            0.11,
            0.18
          ),
          padding: 6,
        });

        cellX += column.width;
      }
    }
  );
}

function getCategoryLabel(
  category: FinanceReportPdfRuleCategory
) {
  switch (category) {
    case "OTA_COMMISSION":
      return "Commissioni OTA";

    case "VAT":
      return "IVA";

    case "CLEANING":
      return "Pulizie";

    case "MANAGEMENT_COMMISSION":
      return "Commissione gestione";

    case "TAX":
      return "Imposte";

    case "OTHER":
      return "Altre voci";
  }
}

function buildCategorySummary(
  rules: FinanceReportPdfRule[]
): CategorySummaryItem[] {
  const totals = new Map<
    FinanceReportPdfRuleCategory,
    number
  >();

  for (const rule of rules) {
    const signedAmount =
      rule.operation === "ADD"
        ? rule.calculatedAmount
        : -rule.calculatedAmount;

    const currentAmount =
      totals.get(rule.category) ?? 0;

    totals.set(
      rule.category,
      currentAmount + signedAmount
    );
  }

  return CATEGORY_ORDER.map(
    (category) => ({
      category,
      label:
        getCategoryLabel(category),
      amount:
        totals.get(category) ?? 0,
    })
  ).filter(
    (item) =>
      Math.abs(item.amount) > 0.0001
  );
}

function drawSummary({
  page,
  font,
  boldFont,
  input,
}: {
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  input: FinanceReportPdfInput;
}) {
  const summaryY =
    PAGE_MARGIN +
    FOOTER_HEIGHT;

  const summaryWidth =
    CONTENT_WIDTH;

  const leftWidth = 390;

  const rightWidth =
    summaryWidth - leftWidth;

  page.drawRectangle({
    x: PAGE_MARGIN,
    y: summaryY,
    width: summaryWidth,
    height: SUMMARY_HEIGHT,
    borderWidth: 0.8,
    borderColor: rgb(
      0.82,
      0.86,
      0.91
    ),
    color: rgb(
      0.98,
      0.98,
      0.99
    ),
  });

  page.drawRectangle({
    x: PAGE_MARGIN,
    y: summaryY,
    width: leftWidth,
    height: SUMMARY_HEIGHT,
    color: rgb(
      0.97,
      0.98,
      1
    ),
  });

  page.drawText(
    "RIEPILOGO PER CATEGORIA",
    {
      x: PAGE_MARGIN + 12,
      y:
        summaryY +
        SUMMARY_HEIGHT -
        18,
      size: 8,
      font: boldFont,
      color: rgb(
        0.39,
        0.45,
        0.55
      ),
    }
  );

  const categorySummary =
    buildCategorySummary(
      input.rules
    );

  
  const visibleCategorySummary =
    input.template.showCategorySummary
      ? categorySummary
      : [];
if (
    categorySummary.length === 0
  ) {
    page.drawText(
      "Nessuna rettifica applicata",
      {
        x: PAGE_MARGIN + 12,
        y:
          summaryY +
          SUMMARY_HEIGHT -
          40,
        size: 8,
        font,
        color: rgb(
          0.39,
          0.45,
          0.55
        ),
      }
    );
  } else {
    categorySummary.forEach(
      (item, index) => {
        const itemY =
          summaryY +
          SUMMARY_HEIGHT -
          37 -
          index * 13;

        page.drawText(
          truncateText({
            text: normalizePdfText(
              item.label
            ),
            font,
            size: 7.5,
            maxWidth: 270,
          }),
          {
            x: PAGE_MARGIN + 12,
            y: itemY,
            size: 7.5,
            font,
            color: rgb(
              0.2,
              0.25,
              0.33
            ),
          }
        );

        drawRightAlignedText({
          page,
          text:
            formatSignedCurrency(
              item.amount,
              input.currency
            ),
          xRight:
            PAGE_MARGIN +
            leftWidth -
            12,
          y: itemY,
          size: 7.5,
          font: boldFont,
          color:
            item.amount >= 0
              ? rgb(
                  0.09,
                  0.4,
                  0.2
                )
              : rgb(
                  0.75,
                  0.08,
                  0.18
                ),
        });
      }
    );
  }

  if (
    input.template.showManualAdjustments &&
    input.adjustments.length > 0
  ) {
    const manualHeadingY =
      summaryY +
      SUMMARY_HEIGHT -
      58 -
      visibleCategorySummary.length * 13;

    page.drawText(
      "RETTIFICHE MANUALI",
      {
        x: PAGE_MARGIN + 12,
        y: manualHeadingY,
        size: 7.5,
        font: boldFont,
        color: hexToPdfRgb(input.template.primaryColor),
      }
    );

    input.adjustments.forEach(
      (adjustment, index) => {
        const itemY =
          manualHeadingY -
          16 -
          index * 13;

        page.drawText(
          truncateText({
            text:
              normalizePdfText(
                adjustment.description
              ),
            font,
            size: 7.5,
            maxWidth: 270,
          }),
          {
            x: PAGE_MARGIN + 12,
            y: itemY,
            size: 7.5,
            font,
            color: rgb(
              0.2,
              0.25,
              0.33
            ),
          }
        );

        drawRightAlignedText({
          page,
          text:
            formatSignedCurrency(
              adjustment.amount,
              input.currency
            ),
          xRight:
            PAGE_MARGIN +
            leftWidth -
            12,
          y: itemY,
          size: 7.5,
          font: boldFont,
          color:
            adjustment.amount >= 0
              ? rgb(
                  0.09,
                  0.4,
                  0.2
                )
              : rgb(
                  0.75,
                  0.08,
                  0.18
                ),
        });
      }
    );
  }

  const manualAdjustmentsTotal =
    input.adjustments.reduce(
      (total, adjustment) =>
        total +
        adjustment.amount,
      0
    );

  const adjustedFinalAmount =
    input.finalAmount +
    manualAdjustmentsTotal;

  const rightX =
    PAGE_MARGIN + leftWidth;

  drawSummaryRow({
    page,
    font,
    boldFont,
    label:
      "Lordo prenotazioni",
    value: formatCurrency(
      input.grossRevenue,
      input.currency
    ),
    x: rightX,
    y:
      summaryY +
      SUMMARY_HEIGHT -
      28,
    width: rightWidth,
  });

  drawSummaryRow({
    page,
    font,
    boldFont,
    label: "Rettifiche",
    value:
      formatSignedCurrency(
        adjustedFinalAmount - input.grossRevenue,
        input.currency
      ),
    x: rightX,
    y:
      summaryY +
      SUMMARY_HEIGHT -
      51,
    width: rightWidth,
  });

  page.drawLine({
    start: {
      x: rightX + 12,
      y:
        summaryY +
        SUMMARY_HEIGHT -
        66,
    },
    end: {
      x:
        rightX +
        rightWidth -
        12,
      y:
        summaryY +
        SUMMARY_HEIGHT -
        66,
    },
    thickness: 0.8,
    color: rgb(
      0.82,
      0.86,
      0.91
    ),
  });

  page.drawText(
    "TOTALE PROPRIETARIO",
    {
      x: rightX + 12,
      y: summaryY + 23,
      size: 8,
      font: boldFont,
      color: hexToPdfRgb(input.template.primaryColor),
    }
  );

  drawRightAlignedText({
    page,
    text: formatCurrency(
      adjustedFinalAmount,
      input.currency
    ),
    xRight:
      rightX +
      rightWidth -
      12,
    y: summaryY + 18,
    size: 16,
    font: boldFont,
    color: rgb(
      0.09,
      0.4,
      0.2
    ),
  });
}

function drawSummaryRow({
  page,
  font,
  boldFont,
  label,
  value,
  x,
  y,
  width,
}: {
  page: PDFPage;
  font: PDFFont;
  boldFont: PDFFont;
  label: string;
  value: string;
  x: number;
  y: number;
  width: number;
}) {
  page.drawText(label, {
    x: x + 12,
    y,
    size: 8,
    font,
    color: rgb(
      0.39,
      0.45,
      0.55
    ),
  });

  drawRightAlignedText({
    page,
    text: value,
    xRight:
      x + width - 12,
    y,
    size: 9,
    font: boldFont,
    color: rgb(
      0.06,
      0.09,
      0.16
    ),
  });
}

function drawFooter({
  page,
  font,
  input,
}: {
  page: PDFPage;
  font: PDFFont;
  input: FinanceReportPdfInput;
}) {
  const footerText =
    `Generato il ${formatDateTime(
      new Date()
    )}` +
    ` - Formula: ${normalizePdfText(
      input.formulaName
    )}`;

  page.drawText(
    truncateText({
      text: footerText,
      font,
      size: 6.5,
      maxWidth: CONTENT_WIDTH,
    }),
    {
      x: PAGE_MARGIN,
      y: PAGE_MARGIN - 3,
      size: 6.5,
      font,
      color: rgb(
        0.5,
        0.55,
        0.62
      ),
    }
  );
}

function getBookingCellValue({
  booking,
  column,
}: {
  booking: FinanceReportPdfBooking;
  column: TableColumn;
}) {
  if (column.key === "guest") {
    return normalizePdfText(
      booking.guestName
    );
  }

  if (column.key === "checkIn") {
    return formatShortDate(
      booking.checkIn
    );
  }

  if (column.key === "checkOut") {
    return formatShortDate(
      booking.checkOut
    );
  }

  if (column.key === "channel") {
    return formatChannel(
      booking.channel
    );
  }

  if (column.key === "nights") {
    return String(
      booking.nights
    );
  }

  if (
    column.key ===
    "grossBooking"
  ) {
    return formatCurrency(
      booking.grossBooking,
      booking.currency
    );
  }

  if (
    column.key ===
    "otaCommission"
  ) {
    return booking.otaCommission === null
      ? "-"
      : formatCurrency(
          booking.otaCommission,
          booking.currency
        );
  }

  if (
    column.key ===
    "cleaning"
  ) {
    return formatCurrency(
      booking.cleaningCost,
      booking.currency
    );
  }

  if (
    column.key ===
    "grossProperty"
  ) {
    return booking.grossProperty === null
      ? "-"
      : formatCurrency(
          booking.grossProperty,
          booking.currency
        );
  }

  if (
    column.key ===
    "managementCommission"
  ) {
    return booking.managementCommission === null
      ? "-"
      : formatCurrency(
          booking.managementCommission,
          booking.currency
        );
  }

  if (column.key === "tax") {
    return booking.taxAmount === null
      ? "-"
      : formatCurrency(
          booking.taxAmount,
          booking.currency
        );
  }

  if (column.key === "other") {
    return booking.otherAmount === null
      ? "-"
      : formatSignedCurrency(
          booking.otherAmount,
          booking.currency
        );
  }

  if (
    column.key ===
    "netProperty"
  ) {
    return booking.netProperty === null
      ? "-"
      : formatCurrency(
          booking.netProperty,
          booking.currency
        );
  }

  return "-";
}
function drawCellText({
  page,
  text,
  x,
  y,
  width,
  height,
  font,
  size,
  align,
  color,
  padding,
}: {
  page: PDFPage;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  font: PDFFont;
  size: number;
  align:
    | "left"
    | "center"
    | "right";
  color: ReturnType<
    typeof rgb
  >;
  padding: number;
}) {
  const safeText =
    truncateText({
      text:
        normalizePdfText(text),
      font,
      size,
      maxWidth:
        width - padding * 2,
    });

  const textWidth =
    font.widthOfTextAtSize(
      safeText,
      size
    );

  let textX = x + padding;

  if (align === "center") {
    textX =
      x +
      (width - textWidth) / 2;
  }

  if (align === "right") {
    textX =
      x +
      width -
      padding -
      textWidth;
  }

  const textY =
    y +
    (height - size) / 2 +
    1;

  page.drawText(safeText, {
    x: textX,
    y: textY,
    size,
    font,
    color,
  });
}

function drawRightAlignedText({
  page,
  text,
  xRight,
  y,
  size,
  font,
  color,
  maxWidth,
}: {
  page: PDFPage;
  text: string;
  xRight: number;
  y: number;
  size: number;
  font: PDFFont;
  color: ReturnType<
    typeof rgb
  >;
  maxWidth?: number;
}) {
  const safeText =
    truncateText({
      text:
        normalizePdfText(text),
      font,
      size,
      maxWidth:
        maxWidth ??
        CONTENT_WIDTH,
    });

  const width =
    font.widthOfTextAtSize(
      safeText,
      size
    );

  page.drawText(safeText, {
    x: xRight - width,
    y,
    size,
    font,
    color,
  });
}

function truncateText({
  text,
  font,
  size,
  maxWidth,
}: {
  text: string;
  font: PDFFont;
  size: number;
  maxWidth: number;
}) {
  if (
    font.widthOfTextAtSize(
      text,
      size
    ) <= maxWidth
  ) {
    return text;
  }

  const suffix = "...";
  let result = text;

  while (
    result.length > 0 &&
    font.widthOfTextAtSize(
      result + suffix,
      size
    ) > maxWidth
  ) {
    result =
      result.slice(0, -1);
  }

  return result + suffix;
}

function getTableFontSize(
  rowHeight: number
) {
  if (rowHeight >= 22) {
    return 8;
  }

  if (rowHeight >= 18) {
    return 7;
  }

  if (rowHeight >= 14) {
    return 6;
  }

  return 5;
}

function buildPropertyAddress(
  property: FinanceReportPdfInput["property"]
) {
  return [
    property.address,
    property.zone,
    property.city,
  ]
    .filter(Boolean)
    .map((value) =>
      normalizePdfText(
        String(value)
      )
    )
    .join(", ");
}

function formatChannel(
  channel: string
) {
  if (
    channel === "BOOKING_COM"
  ) {
    return "Booking";
  }

  if (channel === "AIRBNB") {
    return "Airbnb";
  }

  if (channel === "DIRECT") {
    return "Diretta";
  }

  return normalizePdfText(
    channel.replace(/_/g, " ")
  );
}

function formatCurrency(
  value: number,
  currency: string
) {
  return new Intl.NumberFormat(
    "it-IT",
    {
      style: "currency",
      currency,
    }
  ).format(value);
}

function formatSignedCurrency(
  value: number,
  currency: string
) {
  const absoluteValue =
    formatCurrency(
      Math.abs(value),
      currency
    );

  if (value > 0) {
    return `+ ${absoluteValue}`;
  }

  if (value < 0) {
    return `- ${absoluteValue}`;
  }

  return absoluteValue;
}

function formatMonth(
  date: Date
) {
  const result =
    new Intl.DateTimeFormat(
      "it-IT",
      {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }
    ).format(date);

  return (
    result.charAt(0).toUpperCase() +
    result.slice(1)
  );
}

function formatShortDate(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "it-IT",
    {
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    }
  ).format(date);
}

function formatDateTime(
  date: Date
) {
  return new Intl.DateTimeFormat(
    "it-IT",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function normalizePdfText(
  value: string
) {
  return value
    .replace(/[â€™â€˜]/g, "'")
    .replace(/[â€œâ€]/g, '"')
    .replace(/â€“|â€”/g, "-")
    .replace(/\u00a0/g, " ");
}

































