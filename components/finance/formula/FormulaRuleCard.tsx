"use client";

import type { CSSProperties } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Trash2,
} from "lucide-react";

import { HorizonIcon } from "@/components/ui/HorizonIcon";
import { MoneyInput } from "@/components/ui/MoneyInput";

import type {
  FinanceRule,
  FinanceRuleBase,
  FinanceRuleOperation,
  FinanceRuleValueType,
} from "@/lib/finance";

import type { FormulaOption } from "./FormulaSelect";
import { RuleSelect } from "./RuleSelect";

type FormulaRuleCardProps = {
  rule: FinanceRule;
  index: number;
  totalRules: number;
  formulas: FormulaOption[];
  currentFormulaId: string;

  onUpdate: (
    ruleId: string,
    updates: Partial<FinanceRule>
  ) => void;

  onMove: (
    ruleId: string,
    direction: "UP" | "DOWN"
  ) => void;

  onDuplicate: (ruleId: string) => void;
  onRemove: (ruleId: string) => void;
};

export function FormulaRuleCard({
  rule,
  index,
  totalRules,
  formulas,
  currentFormulaId,
  onUpdate,
  onMove,
  onDuplicate,
  onRemove,
}: FormulaRuleCardProps) {
  const availableFormulas = formulas;

  void currentFormulaId;

  function handleValueTypeChange(
    valueType: FinanceRuleValueType
  ) {
    if (valueType === "FORMULA") {
      onUpdate(rule.id, {
        valueType,
        value: 0,
        referencedFormulaId:
          availableFormulas[0]?.id ?? null,
      });

      return;
    }

    onUpdate(rule.id, {
      valueType,
      referencedFormulaId: null,
    });
  }

  return (
    <article
      style={{
        ...ruleCardStyle,
        opacity: rule.isEnabled ? 1 : 0.58,
      }}
    >
      <div style={ruleHeaderStyle}>
        <div style={ruleIdentityStyle}>
          <span style={orderBadgeStyle}>
            {index + 1}
          </span>

          <input
            value={rule.name}
            onChange={(event) =>
              onUpdate(rule.id, {
                name: event.target.value,
              })
            }
            aria-label="Nome regola"
            style={ruleNameInputStyle}
          />
        </div>

        <label style={toggleLabelStyle}>
          <input
            type="checkbox"
            checked={rule.isEnabled}
            onChange={(event) =>
              onUpdate(rule.id, {
                isEnabled: event.target.checked,
              })
            }
          />

          Attiva
        </label>
      </div>

      <div style={ruleFieldsStyle}>
        <RuleSelect
          label="Operazione"
          value={rule.operation}
          options={[
            {
              value: "SUBTRACT",
              label: "Sottrai",
            },
            {
              value: "ADD",
              label: "Aggiungi",
            },
          ]}
          onChange={(value) =>
            onUpdate(rule.id, {
              operation:
                value as FinanceRuleOperation,
            })
          }
        />

        <RuleSelect
          label="Tipo"
          value={rule.valueType}
          options={[
            {
              value: "FIXED",
              label: "Importo fisso",
            },
            {
              value: "PERCENTAGE",
              label: "Percentuale",
            },
            {
              value: "FORMULA",
              label: "Formula salvata",
            },
          ]}
          onChange={(value) =>
            handleValueTypeChange(
              value as FinanceRuleValueType
            )
          }
        />

        {rule.valueType === "FORMULA" ? (
          <div style={fieldStyle}>
            <label style={smallLabelStyle}>
              Formula
            </label>

            <select
              value={
                rule.referencedFormulaId ?? ""
              }
              onChange={(event) =>
                onUpdate(rule.id, {
                  referencedFormulaId:
                    event.target.value ||
                    null,
                })
              }
              style={selectStyle}
              aria-label={`Formula collegata a ${rule.name}`}
            >
              <option value="">
                Seleziona una formula
              </option>

              {availableFormulas.map(
                (formula) => (
                  <option
                    key={formula.id}
                    value={formula.id}
                  >
                    {formula.name}
                  </option>
                )
              )}
            </select>

            {availableFormulas.length ===
            0 ? (
              <span style={helperTextStyle}>
                Non sono disponibili formule
                salvate.
              </span>
            ) : null}
          </div>
        ) : (
          <div style={fieldStyle}>
            <label style={smallLabelStyle}>
              Valore
            </label>

            <MoneyInput
              value={rule.value}
              onChange={(value) =>
                onUpdate(rule.id, {
                  value,
                })
              }
              suffix={
                rule.valueType ===
                "PERCENTAGE"
                  ? "%"
                  : "€"
              }
              ariaLabel={`Valore ${rule.name}`}
            />
          </div>
        )}

        <RuleSelect
          label="Base"
          value={rule.base}
          disabled={
            rule.valueType === "FIXED" ||
            rule.valueType === "FORMULA"
          }
          options={[
            {
              value: "GROSS_REVENUE",
              label: "Prezzo lordo",
            },
            {
              value: "CURRENT_TOTAL",
              label: "Totale corrente",
            },
          ]}
          onChange={(value) =>
            onUpdate(rule.id, {
              base:
                value as FinanceRuleBase,
            })
          }
        />
      </div>

      {!rule.isEnabled ? (
        <div style={disabledRuleStyle}>
          Regola disattivata: non
          partecipa al calcolo.
        </div>
      ) : null}

      <div style={ruleFooterStyle}>
        <div style={moveButtonsStyle}>
          <button
            type="button"
            onClick={() =>
              onMove(rule.id, "UP")
            }
            disabled={index === 0}
            style={{
              ...iconButtonStyle,
              opacity:
                index === 0 ? 0.4 : 1,
            }}
            aria-label="Sposta regola verso l'alto"
            title="Sposta su"
          >
            <HorizonIcon
              icon={ArrowUp}
              size={15}
              tone="muted"
            />
          </button>

          <button
            type="button"
            onClick={() =>
              onMove(rule.id, "DOWN")
            }
            disabled={
              index === totalRules - 1
            }
            style={{
              ...iconButtonStyle,
              opacity:
                index ===
                totalRules - 1
                  ? 0.4
                  : 1,
            }}
            aria-label="Sposta regola verso il basso"
            title="Sposta giù"
          >
            <HorizonIcon
              icon={ArrowDown}
              size={15}
              tone="muted"
            />
          </button>
        </div>

        <div style={actionButtonsStyle}>
          <button
            type="button"
            onClick={() =>
              onDuplicate(rule.id)
            }
            style={outlineButtonStyle}
          >
            <HorizonIcon
              icon={Copy}
              size={15}
              tone="muted"
            />

            Duplica
          </button>

          <button
            type="button"
            onClick={() =>
              onRemove(rule.id)
            }
            style={dangerButtonStyle}
          >
            <HorizonIcon
              icon={Trash2}
              size={15}
              tone="danger"
            />

            Elimina
          </button>
        </div>
      </div>
    </article>
  );
}

const ruleCardStyle: CSSProperties = {
  padding: "18px",
  border: "1px solid #e2e8f0",
  borderRadius: "18px",
  background: "#ffffff",
  boxShadow:
    "0 8px 24px rgba(15, 23, 42, 0.04)",
};

const ruleHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "16px",
};

const ruleIdentityStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
  flex: 1,
};

const orderBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "30px",
  height: "30px",
  flex: "0 0 auto",
  borderRadius: "10px",
  background: "#eef2ff",
  fontSize: "12px",
  fontWeight: 700,
  color: "#4338ca",
};

const ruleNameInputStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "8px 10px",
  border: "1px solid transparent",
  borderRadius: "10px",
  background: "#f8fafc",
  fontSize: "15px",
  fontWeight: 700,
  color: "#0f172a",
  outline: "none",
};

const toggleLabelStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontSize: "12px",
  color: "#64748b",
};

const ruleFieldsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "7px",
};

const smallLabelStyle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#64748b",
};

const selectStyle: CSSProperties = {
  width: "100%",
  height: "40px",
  padding: "0 10px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#ffffff",
  fontSize: "13px",
  color: "#0f172a",
};

const helperTextStyle: CSSProperties = {
  fontSize: "11px",
  lineHeight: 1.4,
  color: "#94a3b8",
};

const disabledRuleStyle: CSSProperties = {
  marginTop: "16px",
  padding: "12px 14px",
  border: "1px dashed #cbd5e1",
  borderRadius: "12px",
  background: "#f8fafc",
  fontSize: "12px",
  color: "#64748b",
};

const ruleFooterStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginTop: "14px",
  paddingTop: "14px",
  borderTop: "1px solid #f1f5f9",
  flexWrap: "wrap",
};

const moveButtonsStyle: CSSProperties = {
  display: "flex",
  gap: "6px",
};

const actionButtonsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const iconButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "34px",
  height: "34px",
  padding: 0,
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  cursor: "pointer",
};

const outlineButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  height: "34px",
  padding: "0 11px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  fontSize: "12px",
  fontWeight: 700,
  color: "#475569",
  cursor: "pointer",
};

const dangerButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  height: "34px",
  padding: "0 11px",
  border: "1px solid #fecaca",
  borderRadius: "9px",
  background: "#fff1f2",
  fontSize: "12px",
  fontWeight: 700,
  color: "#be123c",
  cursor: "pointer",
};