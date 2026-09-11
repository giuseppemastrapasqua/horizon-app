import {
  BarChart3,
  Building2,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/auth/LoginForm";

function HorizonMark({ compact = false }: { compact?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className={compact ? "h-11 w-11" : "h-[72px] w-[72px]"}
    >
      {/* Left serif stem */}
      <path
        d="
          M22 15
          H51
          V19
          C45 19 42 21 42 27
          V93
          C42 99 45 101 51 101
          V105
          H22
          V101
          C28 101 31 99 31 93
          V27
          C31 21 28 19 22 19
          Z
        "
        fill="#ddb96a"
      />

      {/* Right serif stem */}
      <path
        d="
          M69 15
          H98
          V19
          C92 19 89 21 89 27
          V93
          C89 99 92 101 98 101
          V105
          H69
          V101
          C75 101 78 99 78 93
          V27
          C78 21 75 19 69 19
          Z
        "
        fill="#ddb96a"
      />

      {/* Horizon arc */}
      <path
        d="M12 67 C35 50 78 48 108 67"
        fill="none"
        stroke="#e8c777"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    redirect(session.user.role === "OPERATOR" ? "/bookings" : "/dashboard");
  }

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#050b11] text-[#f7f2e8]"
      style={{
        backgroundImage: "url('/images/horizon-login-hero.png')",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="absolute inset-0 bg-black/30" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,10,16,0.92)_0%,rgba(4,10,16,0.56)_45%,rgba(4,10,16,0.72)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(213,176,105,0.10),transparent_30%)]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-screen flex-col justify-between px-10 py-9 lg:flex xl:px-16 xl:py-12">
          <div className="flex items-start gap-5">
            <HorizonMark />

            <div className="pt-1">
              <p className="text-2xl font-light tracking-[0.34em] text-white xl:text-3xl">
                HORIZON
              </p>

              <p className="mt-2 text-[10px] font-medium tracking-[0.34em] text-white/55">
                HOSPITALITY MANAGEMENT
              </p>
            </div>
          </div>

          <div className="max-w-xl pb-6 xl:pb-10">
            <div className="mb-6 h-px w-14 bg-[#dfbf77]" />

            <h1 className="max-w-lg font-serif text-5xl font-normal leading-[1.02] tracking-[-0.035em] text-[#fffaf0] xl:text-6xl">
              Più valore
              <br />
              all&apos;ospitalità
            </h1>

            <p className="mt-7 max-w-md text-base leading-7 text-white/72 xl:text-lg xl:leading-8">
              Tecnologia, persone e dati per far crescere le tue proprietà,
              più lontano.
            </p>

            <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.36em] text-[#e3c57e]">
              Firenze, sempre più vicina
            </p>
          </div>

          <div>
            <div className="grid max-w-2xl grid-cols-3 gap-3">
              <div className="border-t border-white/15 pt-5">
                <Building2 className="size-5 text-[#e3c57e]" />
                <p className="mt-3 text-sm font-medium text-white">
                  Gestione semplice
                </p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Tutto sotto controllo
                </p>
              </div>

              <div className="border-t border-white/15 pt-5">
                <BarChart3 className="size-5 text-[#e3c57e]" />
                <p className="mt-3 text-sm font-medium text-white">
                  Più valore
                </p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Dati che guidano
                </p>
              </div>

              <div className="border-t border-white/15 pt-5">
                <UsersRound className="size-5 text-[#e3c57e]" />
                <p className="mt-3 text-sm font-medium text-white">
                  Un team
                </p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  Sempre con te
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <span className="h-px w-10 bg-[#d9b66c]" />
              <p className="text-[9px] font-medium uppercase tracking-[0.38em] text-white/45">
                Built for a brighter hospitality
              </p>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-10 xl:px-16">
          <div className="w-full max-w-xl">
            <div className="mb-6 flex items-center justify-center gap-4 lg:hidden">
              <HorizonMark compact />

              <div>
                <p className="text-lg font-light tracking-[0.3em] text-white">
                  HORIZON
                </p>
                <p className="mt-1 text-[8px] tracking-[0.28em] text-white/50">
                  HOSPITALITY MANAGEMENT
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#d6b36b]/25 bg-[#07111a]/88 p-6 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-9 xl:p-12">
              <div className="mb-9">
                <div className="mb-6 h-px w-12 bg-[#d9b66c]" />

                <h2 className="font-serif text-4xl font-normal tracking-[-0.025em] text-[#fffaf0] sm:text-5xl">
                  Bentornato
                </h2>

                <p className="mt-3 text-base text-white/58">
                  Accedi al tuo account Horizon
                </p>
              </div>

              <LoginForm />

              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/38">
                <ShieldCheck className="size-4 text-[#d9b66c]/70" />
                Connessione sicura e dati protetti
              </div>

              <div className="mt-8 border-t border-white/[0.08] pt-6 text-center">
                <p className="text-xs text-white/36">
                  Horizon · Tecnologia, persone, dati, risultati.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/30 lg:hidden">
              <LockKeyhole className="size-3.5" />
              Hospitality Management
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

