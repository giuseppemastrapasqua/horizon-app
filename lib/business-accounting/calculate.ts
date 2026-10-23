import type { Accounting, Movement } from "./config";

export function calculateAccounting(data: Accounting, year: number) {
  const active = data.movements.filter((m) => !m.archived && m.date.startsWith(`${year}-`));
  const settled = active.filter((m) => m.paid);
  const sum = (rows: Movement[], kind: Movement["kind"]) => rows.filter((m) => m.kind === kind).reduce((n, m) => n + m.amount, 0);
  const income = sum(settled, "INCOME");
  const expenses = sum(settled, "EXPENSE");
  const contributionsPaid = sum(settled, "CONTRIBUTION");
  const taxesPaid = sum(settled, "TAX");
  const deductible = settled.filter((m) => m.kind === "CONTRIBUTION" && m.deductible).reduce((n, m) => n + m.amount, 0);
  const fiscalGross = Math.round(income * data.coefficient / 100);
  const taxable = Math.max(0, fiscalGross - deductible);
  // Above 100k the current-year flat-rate regime cannot be projected with this model.
  const validFiscal = data.fiscalConfirmed && income <= 10_000_000;
  const taxEstimate = validFiscal ? Math.round(taxable * data.taxRate / 100) : null;
  const currentTaxPaid = settled.filter((m) => m.kind === "TAX" && m.taxYear === year).reduce((n, m) => n + m.amount, 0);
  const currentContributionPaid = settled.filter((m) => m.kind === "CONTRIBUTION" && m.taxYear === year).reduce((n, m) => n + m.amount, 0);
  const contributionEstimate = data.contributionEstimate;
  const reserveTax = taxEstimate === null ? null : Math.max(0, taxEstimate - currentTaxPaid);
  const reserveContribution = contributionEstimate === null ? null : Math.max(0, contributionEstimate - currentContributionPaid);
  const reserve = reserveTax === null || reserveContribution === null ? null : reserveTax + reserveContribution;
  const thirdParty = data.openingThirdParty + sum(settled, "THIRD_IN") - sum(settled, "THIRD_OUT");
  const balance = data.openingBalance + income - expenses - contributionsPaid - taxesPaid + sum(settled, "THIRD_IN") - sum(settled, "THIRD_OUT") + sum(settled, "PERSONAL_IN") - sum(settled, "PERSONAL_OUT");
  const net = taxEstimate === null || contributionEstimate === null ? null : income - expenses - taxEstimate - contributionEstimate;
  return { income, expenses, contributionsPaid, taxesPaid, deductible, fiscalGross, taxable, taxEstimate,
    contributionEstimate, reserveTax, reserveContribution, reserve, thirdParty, balance, net,
    available: reserve === null ? null : balance - Math.max(0, thirdParty) - reserve,
    receivables: sum(active.filter((m) => !m.paid), "INCOME"), payables: sum(active.filter((m) => !m.paid), "EXPENSE"),
    months: Array.from({ length: 12 }, (_, i) => {
      const rows = settled.filter((m) => Number(m.date.slice(5, 7)) === i + 1);
      return { month: i + 1, income: sum(rows, "INCOME"), expenses: sum(rows, "EXPENSE"), contributions: sum(rows, "CONTRIBUTION"), taxes: sum(rows, "TAX") };
    }),
  };
}
