"use server";

import { redirect } from "next/navigation";

import { createFinanceReport } from "@/lib/finance/create-finance-report";

export async function generateFinanceReportAction(
  formData: FormData
) {
  const propertyId = getRequiredString(
    formData,
    "propertyId"
  );

  const referenceMonthValue = getRequiredString(
    formData,
    "referenceMonth"
  );

  const referenceMonth = parseReferenceMonth(
    referenceMonthValue
  );

  const report = await createFinanceReport({
    propertyId,
    referenceMonth,
  });

  redirect(
    `/reports/monthly/${report.id}`
  );
}

function getRequiredString(
  formData: FormData,
  fieldName: string
) {
  const value = formData.get(fieldName);

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      `Il campo "${fieldName}" è obbligatorio.`
    );
  }

  return value.trim();
}

function parseReferenceMonth(
  value: string
) {
  const match = /^(\d{4})-(\d{2})$/.exec(
    value
  );

  if (!match) {
    throw new Error(
      "Il mese di riferimento non è valido."
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      "Il mese di riferimento non è valido."
    );
  }

  return new Date(
    Date.UTC(year, month - 1, 1)
  );
}