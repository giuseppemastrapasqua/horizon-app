"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, LoaderCircle, Mail } from "lucide-react";

import { requestPasswordResetAction } from "@/app/password-reset-actions";

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const result = await requestPasswordResetAction(formData);
      setMessage(result.message);
    } catch {
      setError(
        "Non Ã¨ stato possibile completare la richiesta. Riprova tra poco.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-[#FFF8EA]"
          >
            Indirizzo email
          </label>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#8EA0AE]" />

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="nome@azienda.it"
              disabled={isSubmitting}
              required
              className="h-13 w-full rounded-2xl border border-white/10 bg-[#0D1923] py-3 pl-12 pr-4 text-base text-[#FFF8EA] outline-none transition placeholder:text-[#8EA0AE] focus:border-[#D8B367] focus:ring-4 focus:ring-[#D8B367]/10 disabled:cursor-not-allowed disabled:bg-[#07111A] disabled:text-[#8EA0AE]"
            />
          </div>
        </div>

        {message ? (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800"
          >
            {message}
          </div>
        ) : null}

        {error ? (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#D8B367] px-5 py-3 font-medium text-[#07111A] shadow-lg shadow-black/20 transition hover:bg-[#E4C47E] focus:outline-none focus:ring-4 focus:ring-[#D8B367]/20 disabled:cursor-not-allowed disabled:bg-[#D8B367]/50"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="size-5 animate-spin" />
              Invio in corso
            </>
          ) : (
            "Invia link di reimpostazione"
          )}
        </button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-2 text-sm font-medium text-[#8EA0AE] transition hover:text-[#D8B367]"
      >
        <ArrowLeft className="size-4" />
        Torna allâ€™accesso
      </Link>
    </div>
  );
}
