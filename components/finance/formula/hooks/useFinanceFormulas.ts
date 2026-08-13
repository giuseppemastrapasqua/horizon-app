"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  FinanceFormula,
  FinanceRule,
} from "@/lib/finance";

import type { FormulaOption } from "../FormulaSelect";

type LoadedFormula =
  FinanceFormula & FormulaOption;

type ApiFormula =
  Omit<FormulaOption, "status"> & {
    status: string;
    rules: Array<
      Omit<FinanceRule, "value"> & {
        value: number | string;
      }
    >;
  };

type FormulasResponse = {
  formulas?: ApiFormula[];
  error?: string;
};

function parseResponse(
  responseText: string,
): FormulasResponse {
  if (!responseText.trim()) {
    return {};
  }

  try {
    return JSON.parse(
      responseText,
    ) as FormulasResponse;
  } catch {
    throw new Error(
      "Il server ha restituito una risposta non valida.",
    );
  }
}

async function fetchFormulas(
  signal?: AbortSignal,
): Promise<LoadedFormula[]> {
  const response = await fetch(
    "/api/finance/formulas?includeRules=true",
    {
      signal,
    },
  );

  const responseText =
    await response.text();

  const data =
    parseResponse(responseText);

  if (!response.ok) {
    throw new Error(
      data.error ??
        `Non è stato possibile caricare le formule. Errore ${response.status}.`,
    );
  }

  return (data.formulas ?? []).map(
    (formula): LoadedFormula => ({
      ...formula,
      currency: "EUR",
      rules: formula.rules.map(
        (rule) => ({
          ...rule,
          value: Number(rule.value),
        }),
      ),
    }),
  );
}

function getErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof DOMException &&
    error.name === "AbortError"
  ) {
    return "";
  }

  return error instanceof Error
    ? error.message
    : "Non è stato possibile caricare le formule.";
}

export function useFinanceFormulas() {
  const [formulas, setFormulas] =
    useState<LoadedFormula[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadFormulas =
    useCallback(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loaded =
          await fetchFormulas();

        setFormulas(loaded);
      } catch (loadError) {
        setError(
          getErrorMessage(loadError),
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    const controller =
      new AbortController();

    fetchFormulas(controller.signal)
      .then((loaded) => {
        if (
          controller.signal.aborted
        ) {
          return;
        }

        setFormulas(loaded);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (
          controller.signal.aborted
        ) {
          return;
        }

        setError(
          getErrorMessage(loadError),
        );
      })
      .finally(() => {
        if (
          !controller.signal.aborted
        ) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  return {
    formulas,
    isLoading,
    error,
    refresh: loadFormulas,
  };
}