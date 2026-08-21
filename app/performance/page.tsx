import {
  Activity,
} from "lucide-react";

import {
  AppShell,
} from "@/components/AppShell";

export default function PerformancePage() {
  return (
    <AppShell
      title="Performance giornaliera"
      subtitle="Analisi operativa e commerciale separata dalla Home."
    >
      <section className="rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Activity
            size={21}
          />
        </span>

        <h2 className="mt-4 text-base font-bold text-slate-900">
          Performance Horizon
        </h2>

        <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-500">
          Questa sezione ospiterà occupazione, ricavi, ADR,
          andamento giornaliero e indicatori di performance.
        </p>
      </section>
    </AppShell>
  );
}
