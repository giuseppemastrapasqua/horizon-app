"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  prisma,
} from "@/lib/prisma";

import { requirePropertyAccess } from "@/lib/auth/guards";

export async function addFinanceReportAdjustmentAction(
  formData: FormData,
): Promise<void> {
  const reportId =
    String(
      formData.get("reportId") ?? "",
    ).trim();

  const type =
    String(
      formData.get("type") ?? "",
    ).trim();

  const description =
    String(
      formData.get("description") ?? "",
    ).trim();

  const amountText =
    String(
      formData.get("amount") ?? "",
    )
      .trim()
      .replace(",", ".");

  if (!reportId) {
    throw new Error(
      "Rendiconto non valido.",
    );
  }

  if (
    type !== "EXPENSE" &&
    type !== "CREDIT"
  ) {
    throw new Error(
      "Tipo di rettifica non valido.",
    );
  }

  if (!description) {
    throw new Error(
      "Inserisci una descrizione.",
    );
  }

  const amount =
    Number(amountText);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      "Inserisci un importo maggiore di zero.",
    );
  }

  const report =
    await prisma.financeReport.findUnique({
      where: {
        id: reportId,
      },

      select: {
        id: true,
        propertyId: true,
      },
    });

  if (!report) {
    throw new Error(
      "Rendiconto non trovato.",
    );
  }

  await requirePropertyAccess(report.propertyId);

  const signedAmount =
    type === "EXPENSE"
      ? -Math.abs(amount)
      : Math.abs(amount);

  await prisma.financeReportAdjustment.create({
    data: {
      reportId,
      description,
      amount:
        Number(
          signedAmount.toFixed(2),
        ),
    },
  });

  revalidatePath(
    `/reports/monthly/${reportId}`,
  );

  revalidatePath(
    `/reports/monthly/${reportId}/pdf`,
  );

  revalidatePath(
    "/reports/finance",
  );
}

export async function deleteFinanceReportAdjustmentAction(
  formData: FormData,
): Promise<void> {
  const reportId =
    String(
      formData.get("reportId") ?? "",
    ).trim();

  const adjustmentId =
    String(
      formData.get("adjustmentId") ?? "",
    ).trim();

  if (
    !reportId ||
    !adjustmentId
  ) {
    throw new Error(
      "Rettifica non valida.",
    );
  }

  const report =
    await prisma.financeReport.findUnique({
      where: { id: reportId },
      select: { propertyId: true },
    });

  if (!report) {
    throw new Error("Rendiconto non trovato.");
  }

  await requirePropertyAccess(report.propertyId);

  const adjustment =
    await prisma.financeReportAdjustment.findFirst({
      where: {
        id: adjustmentId,
        reportId,
      },

      select: {
        id: true,
      },
    });

  if (!adjustment) {
    throw new Error(
      "Rettifica non trovata.",
    );
  }

  await prisma.financeReportAdjustment.delete({
    where: {
      id: adjustment.id,
    },
  });

  revalidatePath(
    `/reports/monthly/${reportId}`,
  );

  revalidatePath(
    `/reports/monthly/${reportId}/pdf`,
  );

  revalidatePath(
    "/reports/finance",
  );
}