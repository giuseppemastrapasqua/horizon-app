import {
  BarChart3,
  Building2,
  LockKeyhole,
  Sparkles,
} from "lucide-react";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 text-white">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_42%)]" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3 px-12 py-10">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
              <div className="relative h-5 w-6">
                <span className="absolute left-0 top-0 h-full w-1.5 rounded-full bg-white" />
                <span className="absolute right-0 top-0 h-full w-1.5 rounded-full bg-white" />
                <span className="absolute left-1/2 top-1/2 h-1.5 w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-sky-200" />
              </div>
            </div>

            <div>
              <p className="text-lg font-semibold tracking-tight">
                Horizon
              </p>

              <p className="text-sm text-slate-400">
                Property Management OS
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-2xl px-12 pb-14">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-sm text-blue-200">
              <Sparkles className="size-4" />
              Il tuo business, visto più lontano
            </div>

            <h1 className="max-w-xl text-5xl font-semibold leading-tight tracking-tight">
              Tutto ciò che serve per gestire, crescere e decidere meglio.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Horizon riunisce immobili, prenotazioni, operazioni, finanza e
              intelligenza artificiale in un&apos;unica piattaforma.
            </p>

            <div className="mt-12 grid max-w-xl grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Building2 className="size-5 text-blue-300" />

                <p className="mt-4 text-sm font-medium">
                  Property Core
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Immobili e proprietari
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <BarChart3 className="size-5 text-blue-300" />

                <p className="mt-4 text-sm font-medium">
                  Performance
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Ricavi e previsioni
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <Sparkles className="size-5 text-blue-300" />

                <p className="mt-4 text-sm font-medium">
                  AI Copilot
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Insight e opportunità
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-950 sm:px-10">
          <div className="absolute left-6 top-6 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-blue-600">
              <div className="relative h-5 w-6">
                <span className="absolute left-0 top-0 h-full w-1.5 rounded-full bg-white" />
                <span className="absolute right-0 top-0 h-full w-1.5 rounded-full bg-white" />
                <span className="absolute left-1/2 top-1/2 h-1.5 w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
                <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-sky-200" />
              </div>
            </div>

            <span className="font-semibold tracking-tight">
              Horizon
            </span>
          </div>

          <div className="w-full max-w-md">
            <div className="mb-10">
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <LockKeyhole className="size-5 text-blue-600" />
              </div>

              <p className="text-sm font-medium text-blue-600">
                Bentornato in Horizon
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Accedi al tuo workspace
              </h2>

              <p className="mt-3 leading-7 text-slate-500">
                Inserisci le tue credenziali per continuare.
              </p>
            </div>

            <LoginForm />

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400">
              <LockKeyhole className="size-4" />
              Connessione sicura e dati protetti
            </div>

            <p className="mt-10 text-center text-xs leading-5 text-slate-400">
              Horizon · See further. Manage smarter.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

