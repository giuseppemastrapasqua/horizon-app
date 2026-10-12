import { requireFinanceManager } from "@/lib/auth/management";
import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { FinanceFormulaBuilderClient } from "./FinanceFormulaBuilderClient";

export default async function FinanceFormulaBuilderPage() {
  await requireFinanceManager();
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