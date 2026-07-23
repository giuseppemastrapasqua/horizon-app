import type { CSSProperties } from "react";

import type {
  FinancePreview,
} from "@/lib/finance/preview";

type FinanceCalculationProps = {
  formula: FinancePreview["formula"];
  calculation: FinancePreview["calculation"];
};

export function FinanceCalculation({
  formula,
  calculation,
}: FinanceCalculationProps) {
  if (!formula) {
    return null;
  }

  return (
    <section style={calculationPanelStyle}>
      <div style={sectionHeaderStyle}>
        <div>
          <div style={sectionEyebrowStyle}>
            CALCOLO FINANZIARIO
          </div>

          <h3 style={sectionTitleStyle}>
            Dettaglio del rendiconto
          </h3>
        </div>

        {calculation ? (
          <span style={calculationBadgeStyle}>
            Calcolo completato
          </span>
        ) : null}
      </div>

      {calculation ? (
        <>
          <div style={calculationSummaryStyle}>
            <div>
              <div style={calculationLabelStyle}>
                Ricavo lordo
              </div>

              <strong
                style={calculationAmountStyle}
              >
                {formatCurrency(
                  calculation.grossRevenue,
                  calculation.currency
                )}
              </strong>
            </div>

            <div style={calculationArrowStyle}>
              →
            </div>

            <div>
              <div style={calculationLabelStyle}>
                Risultato finale
              </div>

              <strong style={finalAmountStyle}>
                {formatCurrency(
                  calculation.finalAmount,
                  calculation.currency
                )}
              </strong>
            </div>
          </div>

          {calculation.rules.length === 0 ? (
            <div style={emptyStateStyle}>
              La formula non contiene regole
              abilitate. Il risultato finale
              coincide con il ricavo lordo.
            </div>
          ) : (
            <div style={calculationRulesStyle}>
              {calculation.rules.map((rule) => {
                const signedAmount =
                  rule.operation === "ADD"
                    ? rule.calculatedAmount
                    : -rule.calculatedAmount;

                return (
                  <article
                    key={rule.ruleId}
                    style={calculationRuleStyle}
                  >
                    <div
                      style={
                        calculationRuleOrderStyle
                      }
                    >
                      {rule.order}
                    </div>

                    <div
                      style={
                        calculationRuleContentStyle
                      }
                    >
                      <strong
                        style={
                          calculationRuleTitleStyle
                        }
                      >
                        {rule.ruleName}
                      </strong>

                      <div
                        style={
                          calculationRuleMetaStyle
                        }
                      >
                        Base:{" "}
                        {formatCurrency(
                          rule.baseAmount,
                          calculation.currency
                        )}
                        {" · "}
                        {formatRuleValue(
                          rule.valueType,
                          rule.configuredValue,
                          calculation.currency
                        )}
                      </div>
                    </div>

                    <div
                      style={
                        calculationRuleAmountsStyle
                      }
                    >
                      <strong
                        style={
                          rule.operation === "ADD"
                            ? positiveAmountStyle
                            : negativeAmountStyle
                        }
                      >
                        {formatSignedCurrency(
                          signedAmount,
                          calculation.currency
                        )}
                      </strong>

                      <span
                        style={
                          calculationRunningTotalStyle
                        }
                      >
                        Totale:{" "}
                        {formatCurrency(
                          rule.totalAfter,
                          calculation.currency
                        )}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div style={emptyStateStyle}>
          Il calcolo finanziario non è
          disponibile.
        </div>
      )}
    </section>
  );
}

function formatCurrency(
  value: number,
  currency: string
) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(value);
}

function formatSignedCurrency(
  value: number,
  currency: string
) {
  const formattedValue = formatCurrency(
    Math.abs(value),
    currency
  );

  if (value > 0) {
    return `+ ${formattedValue}`;
  }

  if (value < 0) {
    return `- ${formattedValue}`;
  }

  return formattedValue;
}

function formatRuleValue(
  valueType:
    | "FIXED"
    | "PERCENTAGE"
    | "FORMULA",
  value: number,
  currency: string
) {
  if (valueType === "PERCENTAGE") {
    return `${value}%`;
  }

  if (valueType === "FORMULA") {
    return "Formula collegata";
  }

  return formatCurrency(
    value,
    currency
  );
}

const calculationPanelStyle: CSSProperties = {
  padding: "22px",
  marginBottom: "20px",
  border: "1px solid #d1fae5",
  borderRadius: "20px",
  background: "#ffffff",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "18px",
};

const sectionEyebrowStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const sectionTitleStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#0f172a",
  fontSize: "21px",
};

const calculationBadgeStyle: CSSProperties = {
  padding: "7px 10px",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: "12px",
  fontWeight: 700,
};

const calculationSummaryStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(180px, 1fr) auto minmax(180px, 1fr)",
  alignItems: "center",
  gap: "20px",
  padding: "20px",
  marginBottom: "18px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const calculationLabelStyle: CSSProperties = {
  marginBottom: "6px",
  color: "#64748b",
  fontSize: "13px",
  fontWeight: 700,
};

const calculationAmountStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "24px",
};

const finalAmountStyle: CSSProperties = {
  color: "#166534",
  fontSize: "28px",
};

const calculationArrowStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "24px",
  fontWeight: 800,
};

const calculationRulesStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const calculationRuleStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "40px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: "14px",
  padding: "14px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const calculationRuleOrderStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "36px",
  height: "36px",
  borderRadius: "12px",
  background: "#e2e8f0",
  color: "#334155",
  fontSize: "13px",
  fontWeight: 800,
};

const calculationRuleContentStyle: CSSProperties = {
  minWidth: 0,
};

const calculationRuleTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "15px",
};

const calculationRuleMetaStyle: CSSProperties = {
  marginTop: "5px",
  color: "#64748b",
  fontSize: "12px",
};

const calculationRuleAmountsStyle: CSSProperties = {
  display: "grid",
  justifyItems: "end",
  gap: "4px",
  textAlign: "right",
};

const positiveAmountStyle: CSSProperties = {
  color: "#166534",
  fontSize: "15px",
};

const negativeAmountStyle: CSSProperties = {
  color: "#be123c",
  fontSize: "15px",
};

const calculationRunningTotalStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "12px",
};

const emptyStateStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "14px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
};