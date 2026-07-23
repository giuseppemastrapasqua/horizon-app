"use client";

import { useCallback, useState } from "react";

type UseDeleteFinanceFormulaOptions = {
  onDeleted?: () => void | Promise<void>;
};

export function useDeleteFinanceFormula(
  options: UseDeleteFinanceFormulaOptions = {}
) {
  const [isDeleting, setIsDeleting] =
    useState(false);

  const deleteFormula = useCallback(
    async (formulaId: string) => {
      if (!formulaId.trim()) {
        throw new Error(
          "Formula non valida."
        );
      }

      setIsDeleting(true);

      try {
        const response = await fetch(
          `/api/finance/formulas/${formulaId}`,
          {
            method: "DELETE",
          }
        );

        const data =
          (await response.json()) as {
            error?: string;
          };

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Non è stato possibile eliminare la formula."
          );
        }

        await options.onDeleted?.();
      } finally {
        setIsDeleting(false);
      }
    },
    [options]
  );

  return {
    isDeleting,
    deleteFormula,
  };
}