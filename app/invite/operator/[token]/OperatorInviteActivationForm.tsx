"use client";

import Link from "next/link";
import { useState } from "react";

import { acceptPropertyOperatorInviteAction } from "../actions";

type Props = {
  token: string;
  email: string;
  fullName: string;
};

export function OperatorInviteActivationForm({
  token,
  email,
  fullName,
}: Props) {
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");
    setPending(true);

    try {
      const formData = new FormData(event.currentTarget);

      await acceptPropertyOperatorInviteAction(formData);

      setCompleted(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Impossibile completare l'attivazione.",
      );
    } finally {
      setPending(false);
    }
  }

  if (completed) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="font-semibold text-emerald-900">
          Accesso attivato
        </p>

        <p className="mt-2 text-sm leading-6 text-emerald-800">
          Ora puoi accedere a Horizon con {email}.
        </p>

        <Link
          href="/login"
          className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Vai al login
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <input
        type="hidden"
        name="token"
        value={token}
      />

      <div>
        <label className="text-sm font-medium text-slate-700">
          Nome
        </label>

        <input
          value={fullName}
          disabled
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">
          Email
        </label>

        <input
          value={email}
          disabled
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="text-sm font-medium text-slate-700"
        >
          Crea la tua password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          minLength={10}
          maxLength={128}
          required
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />

        <p className="mt-2 text-xs text-slate-500">
          Almeno 10 caratteri.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-slate-700"
        >
          Conferma password
        </label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          minLength={10}
          maxLength={128}
          required
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? "Attivazione..."
          : "Attiva il mio accesso"}
      </button>
    </form>
  );
}