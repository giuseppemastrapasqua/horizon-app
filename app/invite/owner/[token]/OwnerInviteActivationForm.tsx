"use client";

import Link from "next/link";
import { useState } from "react";

import { acceptPropertyOwnerInviteAction } from "../actions";

type Props = {
  token: string;
  email: string;
  fullName: string;
};

export function OwnerInviteActivationForm({
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

      await acceptPropertyOwnerInviteAction(formData);

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
          className="mt-5 inline-flex rounded-xl bg-[#D8B367] px-4 py-2.5 text-sm font-medium text-[#07111A] hover:bg-[#E4C47E]"
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
        <label className="text-sm font-medium text-[#FFF8EA]">
          Nome
        </label>

        <input
          value={fullName}
          disabled
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#07111A] px-4 py-3 text-[#8EA0AE]"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-[#FFF8EA]">
          Email
        </label>

        <input
          value={email}
          disabled
          className="mt-2 w-full rounded-xl border border-white/10 bg-[#07111A] px-4 py-3 text-[#8EA0AE]"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="text-sm font-medium text-[#FFF8EA]"
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
          className="mt-2 w-full rounded-xl border border-white/15 bg-[#0D1923] px-4 py-3 outline-none focus:border-[#D8B367] focus:ring-2 focus:ring-[#D8B367]/15"
        />

        <p className="mt-2 text-xs text-[#8EA0AE]">
          Almeno 10 caratteri.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-[#FFF8EA]"
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
          className="mt-2 w-full rounded-xl border border-white/15 bg-[#0D1923] px-4 py-3 outline-none focus:border-[#D8B367] focus:ring-2 focus:ring-[#D8B367]/15"
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
        className="w-full rounded-xl bg-[#D8B367] px-4 py-3 font-medium text-[#07111A] hover:bg-[#E4C47E] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? "Attivazione..."
          : "Attiva il mio accesso"}
      </button>
    </form>
  );
}