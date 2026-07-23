import { type CSSProperties } from "react";
import { Plus } from "lucide-react";

import { HorizonIcon } from "@/components/ui/HorizonIcon";
import { type FinanceRule } from "@/lib/finance";

import {
  type FormulaOption,
} from "./FormulaSelect";
import { FormulaRuleCard } from "./FormulaRuleCard";

type FormulaRulesPanelProps = {
  rules: FinanceRule[];
  formulas: FormulaOption[];
  currentFormulaId: string;

  onAddRule: () => void;

  onUpdateRule: (
    ruleId: string,
    updates: Partial<FinanceRule>
  ) => void;

  onMoveRule: (
    ruleId: string,
    direction: "UP" | "DOWN"
  ) => void;

  onDuplicateRule: (ruleId: string) => void;
  onRemoveRule: (ruleId: string) => void;
};

export function FormulaRulesPanel({
  rules,
  formulas,
  currentFormulaId,
  onAddRule,
  onUpdateRule,
  onMoveRule,
  onDuplicateRule,
  onRemoveRule,
}: FormulaRulesPanelProps) {
  return (
    <section style={rulesPanelStyle}>
      <div style={panelHeaderStyle}>
        <div>
          <p style={eyebrowStyle}>
            Formula
          </p>

          <h2 style={panelTitleStyle}>
            Passaggi di calcolo
          </h2>
        </div>

        <button
          type="button"
          onClick={onAddRule}
          style={primaryButtonStyle}
        >
          <HorizonIcon
            icon={Plus}
            size={16}
            tone="primary"
          />

          Aggiungi regola
        </button>
      </div>

      <div style={rulesListStyle}>
        {rules.map((rule, index) => (
          <FormulaRuleCard
            key={rule.id}
            rule={rule}
            index={index}
            totalRules={rules.length}
            formulas={formulas}
            currentFormulaId={
              currentFormulaId
            }
            onUpdate={onUpdateRule}
            onMove={onMoveRule}
            onDuplicate={onDuplicateRule}
            onRemove={onRemoveRule}
          />
        ))}
      </div>
    </section>
  );
}

const rulesPanelStyle: CSSProperties = {
  minWidth: 0,
};

const panelHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "16px",
  flexWrap: "wrap",
};

const eyebrowStyle: CSSProperties = {
  margin: 0,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#64748b",
};

const panelTitleStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: "22px",
  color: "#0f172a",
};

const rulesListStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  height: "40px",
  padding: "0 14px",
  border: "none",
  borderRadius: "11px",
  background: "#0f172a",
  fontSize: "13px",
  fontWeight: 700,
  color: "#ffffff",
  cursor: "pointer",
};