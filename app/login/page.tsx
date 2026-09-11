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
      viewBox="0 0 140 140"
      aria-hidden="true"
      className={compact ? "h-11 w-11" : "h-[82px] w-[82px]"}
    >
      <path
        d="M72 8 A62 62 0 1 0 72 132"
        fill="none"
        stroke="#D8B367"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity="0.82"
      />

      <text
        x="27"
        y="99"
        fill="#E4C47E"
        fontFamily="Georgia, Cambria, 'Times New Roman', serif"
        fontSize="84"
        fontWeight="400"
        letterSpacing="-4.5"
      >
        H
      </text>

      <line
        x1="91"
        y1="69"
        x2="116"
        y2="69"
        stroke="#D8B367"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.9"
      />

      <path
        d="M101 64.3 L102.5 67.5 L105.7 69 L102.5 70.5 L101 73.7 L99.5 70.5 L96.3 69 L99.5 67.5 Z"
        fill="#E4C47E"
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
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,10,16,0.84)_0%,rgba(4,10,16,0.42)_45%,rgba(4,10,16,0.64)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(213,176,105,0.10),transparent_30%)]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-screen flex-col justify-between px-10 py-9 lg:flex xl:px-16 xl:py-12">
          <div className="flex items-center gap-5">
            <HorizonMark />

            <div className="flex flex-col justify-center">
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
              {"Pi\u00F9 valore"}
              <br />
              {"all'ospitalit\u00E0"}
            </h1>

            <p className="mt-7 max-w-md text-base leading-7 text-white/72 xl:text-lg xl:leading-8">
              {"Tecnologia, persone e dati per far crescere le tue propriet\u00E0."}
            </p>

            <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.36em] text-[#e3c57e]">
              {"Milano, sempre pi\u00F9 vicina"}
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
                  {"Pi\u00F9 valore"}
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
                  {"Horizon \u00B7 Tecnologia, persone, dati, risultati."}
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

