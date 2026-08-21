"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function getString(
  formData: FormData,
  key: string
) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function checked(
  formData: FormData,
  key: string
) {
  return formData.get(key) === "on";
}

export async function updateFinanceReportTemplateAction(
  formData: FormData
) {
  const propertyId = getString(
    formData,
    "propertyId"
  );

  if (!propertyId) {
    throw new Error(
      "propertyId mancante."
    );
  }

  const data = {
    name:
      getString(formData, "name") ||
      "Rendiconto Horizon",

    headerTitle:
      getString(
        formData,
        "headerTitle"
      ) ||
      "Rendiconto proprietario",

    primaryColor:
      getString(
        formData,
        "primaryColor"
      ) ||
      "#2563EB",

    logoUrl:
      getString(
        formData,
        "logoUrl"
      ) || null,

    footerText:
      getString(
        formData,
        "footerText"
      ) || null,

    isDefault: false,

    showBookingDetails:
      checked(
        formData,
        "showBookingDetails"
      ),

    showOtaCommissions:
      checked(
        formData,
        "showOtaCommissions"
      ),

    showCleaningCosts:
      checked(
        formData,
        "showCleaningCosts"
      ),

    showManagementFees:
      checked(
        formData,
        "showManagementFees"
      ),

    showTaxes:
      checked(
        formData,
        "showTaxes"
      ),

    showManualAdjustments:
      checked(
        formData,
        "showManualAdjustments"
      ),

    showCategorySummary:
      checked(
        formData,
        "showCategorySummary"
      ),
  };

  await prisma.financeReportTemplate.upsert({
    where: {
      propertyId,
    },

    update: data,

    create: {
      propertyId,
      ...data,
    },
  });

  revalidatePath(
    `/properties/${propertyId}/edit`
  );
}

export async function resetFinanceReportTemplateAction(
  formData: FormData
) {
  const propertyId =
    getString(
      formData,
      "propertyId"
    );

  if (!propertyId) {
    throw new Error(
      "propertyId mancante."
    );
  }

  await prisma.financeReportTemplate.deleteMany({
    where: {
      propertyId,
    },
  });

  revalidatePath(
    `/properties/${propertyId}/edit`
  );
}
