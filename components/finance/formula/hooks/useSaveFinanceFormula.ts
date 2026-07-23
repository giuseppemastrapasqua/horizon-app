"use client";

import {
  useCallback,
  useState,
} from "react";

import type {
  FinanceRule,
} from "@/lib/finance";

export type FinanceFormulaScope =
  | "SINGLE_PROPERTY"
  | "ALL_PROPERTIES";

type SaveFinanceFormulaInput = {
  formulaId?: string;

  scope?: FinanceFormulaScope;

  propertyId: string | null;

  name: string;
  description: string;
  rules: FinanceRule[];
};

type SaveFinanceFormulaResponse = {
  formula?: {
    id: string;
  };
  error?: string;
};

type SaveFinanceFormulaResult = {
  formulaId: string;
  mode: "created" | "updated";
};

type UseSaveFinanceFormulaOptions = {
  onSaved?: () =>
    void | Promise<void>;
};

export function useSaveFinanceFormula(
  options: UseSaveFinanceFormulaOptions = {}
) {
  const [isSaving, setIsSaving] =
    useState(false);

  const saveFormulaRequest = useCallback(
    async (
      input: SaveFinanceFormulaInput
    ): Promise<SaveFinanceFormulaResult> => {
      const formulaId =
        input.formulaId?.trim() ?? "";

      const isEditing =
        formulaId.length > 0;

      const scope =
        input.scope ??
        "SINGLE_PROPERTY";

      const propertyId =
        scope === "ALL_PROPERTIES"
          ? null
          : input.propertyId?.trim() || null;

      const response = await fetch(
        isEditing
          ? `/api/finance/formulas/${formulaId}`
          : "/api/finance/formulas",
        {
          method: isEditing
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            scope,
            propertyId,

            name: input.name.trim(),

            description:
              input.description.trim(),

            rules: input.rules.map(
              (rule, index) => ({
                name: rule.name,

                description:
                  rule.description ?? "",

                order: index + 1,

                isEnabled:
                  rule.isEnabled,

                operation:
                  rule.operation,

                valueType:
                  rule.valueType,

                base: rule.base,

                value: rule.value,

                referencedFormulaId:
                  rule.referencedFormulaId ??
                  null,
              })
            ),
          }),
        }
      );

      const responseText =
        await response.text();

      let data: SaveFinanceFormulaResponse =
        {};

      if (responseText.trim()) {
        try {
          data = JSON.parse(
            responseText
          ) as SaveFinanceFormulaResponse;
        } catch {
          throw new Error(
            "Il server ha restituito una risposta non valida durante il salvataggio della formula."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Non è stato possibile salvare la formula."
        );
      }

      const savedFormulaId =
        data.formula?.id ??
        formulaId;

      if (!savedFormulaId) {
        throw new Error(
          "Il server non ha restituito l'identificativo della formula."
        );
      }

      await options.onSaved?.();

      return {
        formulaId: savedFormulaId,

        mode: isEditing
          ? "updated"
          : "created",
      };
    },
    [options]
  );

  const saveFormula = useCallback(
    async (
      input: SaveFinanceFormulaInput
    ) => {
      setIsSaving(true);

      try {
        return await saveFormulaRequest(
          input
        );
      } finally {
        setIsSaving(false);
      }
    },
    [saveFormulaRequest]
  );

  return {
    isSaving,
    saveFormula,
  };
}