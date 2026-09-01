"use client";

import {
  useState,
  useTransition,
} from "react";

import { createOwnerQuickAction } from "./owner-actions";

type Owner = {
  id: string;
  fullName: string;
  email: string;
};

export function OwnerSelector({
  initialOwners,
}: {
  initialOwners: Owner[];
}) {
  const [owners, setOwners] =
    useState(initialOwners);

  const [ownerId, setOwnerId] =
    useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [error, setError] =
    useState("");

  const [isPending, startTransition] =
    useTransition();

  const createOwner = () => {
    setError("");

    startTransition(async () => {
      try {
        const owner =
          await createOwnerQuickAction({
            fullName,
            email,
          });

        setOwners((current) => {
          if (
            current.some(
              (item) => item.id === owner.id,
            )
          ) {
            return current;
          }

          return [...current, owner].sort(
            (a, b) =>
              a.fullName.localeCompare(
                b.fullName,
              ),
          );
        });

        setOwnerId(owner.id);
        setFullName("");
        setEmail("");
        setShowCreate(false);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Impossibile creare il proprietario.",
        );
      }
    });
  };

  return (
    <div className="sm:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor="ownerId"
          className="block text-sm font-semibold text-slate-700"
        >
          Proprietario
        </label>

        <button
          type="button"
          onClick={() => {
            setShowCreate((current) => !current);
            setError("");
          }}
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          {showCreate
            ? "Annulla"
            : "+ Nuovo proprietario"}
        </button>
      </div>

      <select
        id="ownerId"
        name="ownerId"
        required
        value={ownerId}
        onChange={(event) =>
          setOwnerId(event.target.value)
        }
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
      >
        <option
          value=""
          disabled
        >
          Seleziona un proprietario
        </option>

        {owners.map((owner) => (
          <option
            key={owner.id}
            value={owner.id}
          >
            {owner.fullName} · {owner.email}
          </option>
        ))}
      </select>

      {showCreate && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              value={fullName}
              onChange={(event) =>
                setFullName(event.target.value)
              }
              placeholder="Nome e cognome"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
            />

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Email"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
            />
          </div>

          {error && (
            <p className="mt-3 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              disabled={
                isPending ||
                !fullName.trim() ||
                !email.trim()
              }
              onClick={createOwner}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending
                ? "Creazione..."
                : "Crea proprietario"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
