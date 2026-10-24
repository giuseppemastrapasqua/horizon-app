"use client";

import Link from "next/link";
import { useState } from "react";

import { activatePropertyOwnerInviteAction } from "../actions";
import { ActivationPasswordField } from "./ActivationPasswordField";

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

      if (formData.get("password") !== formData.get("confirmPassword")) {
        setError("Le password non coincidono. Controlla entrambi i campi.");
        return;
      }

      const result = await activatePropertyOwnerInviteAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }

      setCompleted(true);
    } catch {
      setError("Impossibile completare l'attivazione. Riprova; se il problema persiste contatta l'amministratore Horizon.");
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

      <ActivationPasswordField name="password" label="Crea la tua password" />
      <ActivationPasswordField name="confirmPassword" label="Conferma password" />

      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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