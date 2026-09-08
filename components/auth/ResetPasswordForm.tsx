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
          : "Non è stato possibile reimpostare la password.",
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

        <Link href="/login" className="flex h-13 w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700">
          Accedi a Horizon
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
          Nuova password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required disabled={isSubmitting} placeholder="Almeno 10 caratteri" className="h-13 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100" />
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
          Conferma nuova password
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required disabled={isSubmitting} placeholder="Ripeti la nuova password" className="h-13 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:bg-slate-100" />
        </div>
      </div>

      {error ? (
        <div role="alert" aria-live="polite" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      <button type="submit" disabled={isSubmitting} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-blue-400">
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
