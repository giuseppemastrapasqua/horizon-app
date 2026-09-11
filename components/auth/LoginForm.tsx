"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const email = String(formData.get("email") ?? "")
      .trim()
      .toLowerCase();

    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Inserisci email e password.");
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Email o password non corrette.");
        setIsSubmitting(false);
        return;
      }

      window.location.assign("/login");
    } catch {
      setError(
        "Non è stato possibile completare l’accesso. Riprova tra poco.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <label
          htmlFor="email"
          className="mb-2.5 block text-sm font-medium text-white/82"
        >
          Email
        </label>

        <div className="group relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#d8ba76]/70 transition group-focus-within:text-[#e7ca86]" />

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="La tua email"
            disabled={isSubmitting}
            required
            className="h-14 w-full rounded-xl border border-white/[0.12] bg-white/[0.035] py-3 pl-12 pr-4 text-base text-white outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-[#d8b86f]/70 focus:bg-white/[0.055] focus:ring-4 focus:ring-[#d8b86f]/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between gap-4">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-white/82"
          >
            Password
          </label>

          <a
            href="/forgot-password"
            className="text-xs font-medium text-[#dec17f] transition hover:text-[#f0d799]"
          >
            Password dimenticata?
          </a>
        </div>

        <div className="group relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#d8ba76]/70 transition group-focus-within:text-[#e7ca86]" />

          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="La tua password"
            disabled={isSubmitting}
            required
            className="h-14 w-full rounded-xl border border-white/[0.12] bg-white/[0.035] py-3 pl-12 pr-12 text-base text-white outline-none transition placeholder:text-white/30 hover:border-white/20 focus:border-[#d8b86f]/70 focus:bg-white/[0.055] focus:ring-4 focus:ring-[#d8b86f]/10 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            disabled={isSubmitting}
            aria-label={
              showPassword ? "Nascondi password" : "Mostra password"
            }
            className="absolute right-4 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.06] hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-[#d8b86f]/30 disabled:cursor-not-allowed"
          >
            {showPassword ? (
              <EyeOff className="size-5" />
            ) : (
              <Eye className="size-5" />
            )}
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="group mt-1 flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#ecd28f]/20 bg-[linear-gradient(135deg,#e4c47e_0%,#cfa55a_100%)] px-5 py-3 font-semibold text-[#111820] shadow-[0_14px_36px_rgba(205,164,88,0.20)] transition duration-200 hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_18px_42px_rgba(205,164,88,0.28)] focus:outline-none focus:ring-4 focus:ring-[#d8b86f]/20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" />
            Accesso in corso
          </>
        ) : (
          <>
            Accedi
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      <p className="pt-1 text-center text-xs leading-5 text-white/32">
        Non hai un account? Contatta il tuo amministratore.
      </p>
    </form>
  );
}
