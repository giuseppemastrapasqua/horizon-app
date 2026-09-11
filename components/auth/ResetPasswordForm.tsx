"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";

import { resetPasswordAction } from "@/app/password-reset-actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("token", token);
      await resetPasswordAction(formData);
      setSuccess(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Non Ã¨ stato possibile reimpostare la password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm leading-6 text-emerald-800">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            <div>
              <div className="font-semibold">Password aggiornata.</div>
              <div>Ora puoi accedere a Horizon con la nuova password.</div>
            </div>
          </div>
        </div>

        <Link href="/login" className="flex h-13 w-full items-center justify-center rounded-2xl bg-[#D8B367] px-5 py-3 font-medium text-[#07111A] transition hover:bg-[#E4C47E]">
          Accedi a Horizon
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#FFF8EA]">
          Nuova password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#8EA0AE]" />
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required disabled={isSubmitting} placeholder="Almeno 10 caratteri" className="h-13 w-full rounded-2xl border border-white/10 bg-[#0D1923] py-3 pl-12 pr-4 text-base text-[#FFF8EA] outline-none transition placeholder:text-[#8EA0AE] focus:border-[#D8B367] focus:ring-4 focus:ring-[#D8B367]/10 disabled:bg-[#07111A]" />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-[#FFF8EA]">
          Conferma nuova password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#8EA0AE]" />
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required disabled={isSubmitting} placeholder="Ripeti la nuova password" className="h-13 w-full rounded-2xl border border-white/10 bg-[#0D1923] py-3 pl-12 pr-4 text-base text-[#FFF8EA] outline-none transition placeholder:text-[#8EA0AE] focus:border-[#D8B367] focus:ring-4 focus:ring-[#D8B367]/10 disabled:bg-[#07111A]" />
        </div>
      </div>

      {error ? (
        <div role="alert" aria-live="polite" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <button type="submit" disabled={isSubmitting} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#D8B367] px-5 py-3 font-medium text-[#07111A] shadow-lg shadow-black/20 transition hover:bg-[#E4C47E] focus:outline-none focus:ring-4 focus:ring-[#D8B367]/20 disabled:cursor-not-allowed disabled:bg-[#D8B367]/50">
        {isSubmitting ? (
          <>
            <LoaderCircle className="size-5 animate-spin" />
            Aggiornamento in corso
          </>
        ) : (
          "Reimposta password"
        )}
      </button>
    </form>
  );
}
