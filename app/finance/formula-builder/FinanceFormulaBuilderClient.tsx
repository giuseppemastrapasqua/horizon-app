"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";

import {
  FormulaResultPanel,
  FormulaRulesPanel,
  FormulaSettingsPanel,
  useFormula,
  useFormulaCalculation,
  useFormulaRules,
} from "@/components/finance/formula";
import { FormulaSelect } from "@/components/finance/formula/FormulaSelect";
import type { FinanceFormulaScope } from "@/components/finance/formula/FormulaSettingsPanel";
import { useDeleteFinanceFormula } from "@/components/finance/formula/hooks/useDeleteFinanceFormula";
import { useFinanceFormulas } from "@/components/finance/formula/hooks/useFinanceFormulas";
import { useSaveFinanceFormula } from "@/components/finance/formula/hooks/useSaveFinanceFormula";
import {
  PropertySelect,
  type PropertyOption,
} from "@/components/finance/formula/PropertySelect";
import type {
  FinanceRule,
  FinanceRuleBase,
  FinanceRuleOperation,
  FinanceRuleValueType,
} from "@/lib/finance";

const DEFAULT_FORMULA_NAME =
  "Ricavo proprietario";

const DEFAULT_FORMULA_SCOPE: FinanceFormulaScope =
  "SINGLE_PROPERTY";

type PropertiesResponse = {
  properties?: PropertyOption[];
  error?: string;
};

type ApiFormulaRule = {
  id: string;
  name: string;
  description: string | null;
  order: number;
  isEnabled: boolean;
  operation: FinanceRuleOperation;
  valueType: FinanceRuleValueType;
  value: number | string;
  base: FinanceRuleBase;
  referencedFormulaId?: string | null;
};

type ApiFormula = {
  id: string;
  scope?: FinanceFormulaScope;
  propertyId: string | null;
  name: string;
  description: string | null;
  rules: ApiFormulaRule[];
};

type FormulaResponse = {
  formula?: ApiFormula;
  error?: string;
};

export function FinanceFormulaBuilderClient() {
  const [grossRevenue, setGrossRevenue] =
    useState(1000);

  const [formulaName, setFormulaName] =
    useState(DEFAULT_FORMULA_NAME);

  const [
    formulaDescription,
    setFormulaDescription,
  ] = useState("");

  const [formulaScope, setFormulaScope] =
    useState<FinanceFormulaScope>(
      DEFAULT_FORMULA_SCOPE,
    );

  const [propertyId, setPropertyId] =
    useState("");

  const [
    selectedFormulaId,
    setSelectedFormulaId,
  ] = useState("");

  const [properties, setProperties] =
    useState<PropertyOption[]>([]);

  const [
    isLoadingProperties,
    setIsLoadingProperties,
  ] = useState(true);

  const [
    propertiesError,
    setPropertiesError,
  ] = useState<string | null>(null);

  const [
    isLoadingSelectedFormula,
    setIsLoadingSelectedFormula,
  ] = useState(false);

  const {
    formulas,
    isLoading: isLoadingFormulas,
    error: formulasError,
    refresh: refreshFormulas,
  } = useFinanceFormulas();

  const {
    isSaving,
    saveFormula,
  } = useSaveFinanceFormula({
    onSaved: refreshFormulas,
  });

  const {
    isDeleting,
    deleteFormula,
  } = useDeleteFinanceFormula({
    onDeleted: refreshFormulas,
  });

  const {
    rules,
    orderedRules,
    updateRule,
    addRule,
    removeRule,
    duplicateRule,
    moveRule,
    replaceRules,
    resetRules,
  } = useFormulaRules();

  const formula = useFormula({
    formulaName,
    rules,
  });

  const calculation =
    useFormulaCalculation({
      formula,
      formulas,
      grossRevenue,
    });

  const isEditing =
    selectedFormulaId.length > 0;

  const isBusy =
    isLoadingSelectedFormula ||
    isSaving ||
    isDeleting;

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadProperties() {
      setIsLoadingProperties(true);
      setPropertiesError(null);

      try {
        const response = await fetch(
          "/api/properties",
          {
            signal: controller.signal,
          },
        );

        const data =
          (await response.json()) as PropertiesResponse;

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Non è stato possibile caricare gli immobili.",
          );
        }

        setProperties(
          data.properties ?? [],
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setPropertiesError(
          error instanceof Error
            ? error.message
            : "Non è stato possibile caricare gli immobili.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingProperties(false);
        }
      }
    }

    void loadProperties();

    return () => {
      controller.abort();
    };
  }, []);

  const resetFormulaEditor =
    useCallback(() => {
      setSelectedFormulaId("");

      setFormulaName(
        DEFAULT_FORMULA_NAME,
      );

      setFormulaDescription("");

      setFormulaScope(
        DEFAULT_FORMULA_SCOPE,
      );

      setPropertyId("");

      resetRules();
    }, [resetRules]);

  const handleFormulaSelectionChange =
    useCallback(
      (formulaId: string) => {
        if (!formulaId) {
          resetFormulaEditor();
          return;
        }

        setSelectedFormulaId(formulaId);
      },
      [resetFormulaEditor],
    );

  useEffect(() => {
    if (!selectedFormulaId) {
      return;
    }

    const controller =
      new AbortController();

    async function loadSelectedFormula() {
      setIsLoadingSelectedFormula(true);

      try {
        const response = await fetch(
          `/api/finance/formulas/${selectedFormulaId}`,
          {
            signal: controller.signal,
          },
        );

        const responseText =
          await response.text();

        let data: FormulaResponse = {};

        if (responseText.trim()) {
          try {
            data = JSON.parse(
              responseText,
            ) as FormulaResponse;
          } catch {
            throw new Error(
              "Il server ha restituito una risposta non valida durante il caricamento della formula.",
            );
          }
        }

        if (
          !response.ok ||
          !data.formula
        ) {
          throw new Error(
            data.error ??
              "Non è stato possibile caricare la formula.",
          );
        }

        const loadedFormula =
          data.formula;

        const loadedRules: FinanceRule[] =
          loadedFormula.rules.map(
            (rule) => ({
              id: rule.id,
              name: rule.name,
              description:
                rule.description,
              order: rule.order,
              isEnabled:
                rule.isEnabled,
              operation:
                rule.operation,
              valueType:
                rule.valueType,
              value: Number(
                rule.value,
              ),
              base: rule.base,
              referencedFormulaId:
                rule.referencedFormulaId ??
                null,
            }),
          );

        const loadedScope =
          loadedFormula.scope ??
          (loadedFormula.propertyId
            ? "SINGLE_PROPERTY"
            : "ALL_PROPERTIES");

        setFormulaName(
          loadedFormula.name,
        );

        setFormulaDescription(
          loadedFormula.description ?? "",
        );

        setFormulaScope(
          loadedScope,
        );

        setPropertyId(
          loadedFormula.propertyId ?? "",
        );

        replaceRules(loadedRules);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        alert(
          error instanceof Error
            ? error.message
            : "Non è stato possibile caricare la formula.",
        );

        resetFormulaEditor();
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingSelectedFormula(
            false,
          );
        }
      }
    }

    void loadSelectedFormula();

    return () => {
      controller.abort();
    };
  }, [
    selectedFormulaId,
    replaceRules,
    resetFormulaEditor,
  ]);

  const handleFormulaScopeChange =
    useCallback(
      (
        nextScope: FinanceFormulaScope,
      ) => {
        setFormulaScope(nextScope);

        if (
          nextScope ===
          "ALL_PROPERTIES"
        ) {
          setPropertyId("");
        }
      },
      [],
    );

  const handleSave =
    useCallback(async () => {
      if (
        formulaScope ===
          "SINGLE_PROPERTY" &&
        !propertyId
      ) {
        alert("Seleziona un immobile.");
        return;
      }

      if (!formulaName.trim()) {
        alert(
          "Inserisci il nome della formula.",
        );

        return;
      }

      try {
        const result =
          await saveFormula({
            formulaId:
              selectedFormulaId ||
              undefined,

            scope: formulaScope,

            propertyId:
              formulaScope ===
              "ALL_PROPERTIES"
                ? null
                : propertyId,

            name: formulaName,

            description:
              formulaDescription,

            rules: orderedRules,
          });

        if (
          result.mode === "created"
        ) {
          setSelectedFormulaId(
            result.formulaId,
          );
        }

        alert(
          result.mode === "created"
            ? "Formula creata."
            : "Formula aggiornata.",
        );
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Errore durante il salvataggio.",
        );
      }
    }, [
      formulaScope,
      propertyId,
      formulaName,
      formulaDescription,
      orderedRules,
      selectedFormulaId,
      saveFormula,
    ]);

  const handleDelete =
    useCallback(async () => {
      if (!selectedFormulaId) {
        return;
      }

      const confirmed =
        window.confirm(
          `Vuoi eliminare definitivamente la formula "${formulaName}"?`,
        );

      if (!confirmed) {
        return;
      }

      try {
        await deleteFormula(
          selectedFormulaId,
        );

        resetFormulaEditor();

        alert("Formula eliminata.");
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "Errore durante l'eliminazione.",
        );
      }
    }, [
      selectedFormulaId,
      formulaName,
      deleteFormula,
      resetFormulaEditor,
    ]);

  return (
    <div style={pageStyle}>
      <FormulaSelect
        value={selectedFormulaId}
        formulas={formulas}
        isLoading={
          isLoadingFormulas ||
          isLoadingSelectedFormula
        }
        error={formulasError}
        onChange={
          handleFormulaSelectionChange
        }
      />

      <FormulaSettingsPanel
        formulaName={formulaName}
        formulaDescription={
          formulaDescription
        }
        formulaScope={formulaScope}
        grossRevenue={grossRevenue}
        propertyField={
          <PropertySelect
            value={propertyId}
            properties={properties}
            isLoading={
              isLoadingProperties ||
              isLoadingSelectedFormula
            }
            error={propertiesError}
            onChange={setPropertyId}
          />
        }
        onFormulaNameChange={
          setFormulaName
        }
        onFormulaDescriptionChange={
          setFormulaDescription
        }
        onFormulaScopeChange={
          handleFormulaScopeChange
        }
        onGrossRevenueChange={
          setGrossRevenue
        }
      />

      <div style={actionsStyle}>
        {isEditing ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isBusy}
            style={{
              ...deleteButtonStyle,
              opacity: isBusy
                ? 0.6
                : 1,
              cursor: isBusy
                ? "not-allowed"
                : "pointer",
            }}
          >
            {isDeleting
              ? "Eliminazione..."
              : "Elimina formula"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleSave}
          disabled={isBusy}
          style={{
            ...saveButtonStyle,
            opacity: isBusy
              ? 0.6
              : 1,
            cursor: isBusy
              ? "not-allowed"
              : "pointer",
          }}
        >
          {isSaving
            ? "Salvataggio..."
            : isEditing
              ? "Salva modifiche"
              : "Crea formula"}
        </button>
      </div>

      <div style={builderLayoutStyle}>
        <FormulaRulesPanel
          rules={orderedRules}
          formulas={formulas}
          currentFormulaId={
            selectedFormulaId
          }
          onAddRule={addRule}
          onUpdateRule={updateRule}
          onMoveRule={moveRule}
          onDuplicateRule={
            duplicateRule
          }
          onRemoveRule={removeRule}
        />

        <FormulaResultPanel
          result={calculation.result}
          error={calculation.error}
        />
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  display: "grid",
  gap: "20px",
};

const builderLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 360px",
  gap: "20px",
  alignItems: "start",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
};

const deleteButtonStyle: CSSProperties = {
  height: "42px",
  padding: "0 18px",
  border: "1px solid #dc2626",
  borderRadius: "10px",
  background: "#ffffff",
  color: "#dc2626",
  fontWeight: 600,
};

const saveButtonStyle: CSSProperties = {
  height: "42px",
  padding: "0 18px",
  border: "none",
  borderRadius: "10px",
  background: "#2563eb",
  color: "#ffffff",
  fontWeight: 600,
};
