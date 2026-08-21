"use server";

import { redirect } from "next/navigation";

import { createFinanceReport } from "@/lib/finance/create-finance-report";
import { prisma } from "@/lib/prisma";

export async function generateFinanceReportAction(
  formData: FormData
) {
  const propertyId =
    getRequiredString(
      formData,
      "propertyId"
    );

  const referenceMonthValue =
    getRequiredString(
      formData,
      "referenceMonth"
    );

  const referenceMonth =
    parseReferenceMonth(
      referenceMonthValue
    );

  const existingReport =
    await prisma.financeReport.findFirst({
      where: {
        propertyId,
        referenceMonth,
      },

      select: {
        id: true,
      },
    });

  const report =
    existingReport ??
    await createFinanceReport({
      propertyId,
      referenceMonth,
    });

  redirect(
    `/reports/monthly/${report.id}`
  );
}

export async function generateFinanceReportsBatchAction(
  formData: FormData
) {
  const referenceMonthValue =
    getRequiredString(
      formData,
      "referenceMonth"
    );

  const targetProperty =
    getRequiredString(
      formData,
      "targetProperty"
    );

  const referenceMonth =
    parseReferenceMonth(
      referenceMonthValue
    );

  const properties =
    await prisma.property.findMany({
      where:
        targetProperty === "ALL"
          ? {
              status: {
                not: "ARCHIVED",
              },
            }
          : {
              id: targetProperty,

              status: {
                not: "ARCHIVED",
              },
            },

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
      },
    });

  if (properties.length === 0) {
    throw new Error(
      "Nessuna struttura disponibile."
    );
  }

  const createdReports: {
    id: string;
    propertyId: string;
    propertyName: string;
  }[] = [];

  const failedProperties: {
    propertyId: string;
    propertyName: string;
    error: string;
  }[] = [];

  for (const property of properties) {
    try {
      console.log(
        "[FINANCE BATCH] Generazione:",
        property.name
      );

      const existingReport =
        await prisma.financeReport.findFirst({
          where: {
            propertyId:
              property.id,

            referenceMonth,
          },

          select: {
            id: true,
          },
        });

      const report =
        existingReport ??
        await createFinanceReport({
          propertyId:
            property.id,

          referenceMonth,
        });

      createdReports.push({
        id: report.id,
        propertyId:
          property.id,
        propertyName:
          property.name,
      });

      console.log(
        "[FINANCE BATCH] OK:",
        property.name,
        report.id
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Errore sconosciuto.";

      failedProperties.push({
        propertyId:
          property.id,
        propertyName:
          property.name,
        error: message,
      });

      console.error(
        "[FINANCE BATCH] ERRORE:",
        property.name,
        message
      );

      if (
        targetProperty !== "ALL"
      ) {
        throw error;
      }
    }
  }

  if (
    createdReports.length === 0
  ) {
    throw new Error(
      `Nessun rendiconto generato. ${failedProperties
        .map(
          (item) =>
            `${item.propertyName}: ${item.error}`
        )
        .join(" | ")}`
    );
  }

  if (
    targetProperty !== "ALL" &&
    createdReports.length === 1
  ) {
    redirect(
      `/reports/monthly/${createdReports[0].id}`
    );
  }

  redirect(
    `/reports/finance?generated=${createdReports.length}&skipped=${failedProperties.length}`
  );
}
function getRequiredString(
  formData: FormData,
  fieldName: string
) {
  const value =
    formData.get(
      fieldName
    );

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `Il campo "${fieldName}" Ã¨ obbligatorio.`
    );
  }

  return value.trim();
}

function parseReferenceMonth(
  value: string
) {
  const match =
    /^(\d{4})-(\d{2})$/.exec(
      value
    );

  if (!match) {
    throw new Error(
      "Il mese di riferimento non Ã¨ valido."
    );
  }

  const year =
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    );

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      "Il mese di riferimento non Ã¨ valido."
    );
  }

  return new Date(
    Date.UTC(
      year,
      month - 1,
      1
    )
  );
}




