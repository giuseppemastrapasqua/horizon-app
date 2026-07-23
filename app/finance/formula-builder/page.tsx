import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { FinanceFormulaBuilderClient } from "./FinanceFormulaBuilderClient";

export default function FinanceFormulaBuilderPage() {
  return (
    <>
      <Navigation />

      <AppShell
        title="Formula Builder"
        subtitle="Costruisci e verifica il calcolo economico di ogni immobile."
      >
        <FinanceFormulaBuilderClient />
      </AppShell>
    </>
  );
}