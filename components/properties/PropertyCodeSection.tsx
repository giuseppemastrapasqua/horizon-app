"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import { requestPropertyCodeVerificationAction } from "@/app/properties/[id]/edit/property-code-verification-actions";

type PropertyCodeSectionProps = {
  propertyId: string;
  cin: string | null;
  cir: string | null;
  verificationStatus:
    | "NOT_VERIFIED"
    | "PENDING"
    | "VERIFIED"
    | "NOT_FOUND"
    | "MISMATCH"
    | "REVIEW_REQUIRED";
  verifiedAt: Date | null;
  verificationNotes: string | null;
  updateAction: (formData: FormData) => Promise<void>;
};

const STATUS = {
  NOT_VERIFIED: {
    label: "Non verificato",
    badgeClassName:
      "bg-slate-100 text-slate-700 ring-slate-200",
    panelClassName:
      "border-slate-200 bg-slate-50 text-slate-700",
  },
  PENDING: {
    label: "Verifica in corso",
    badgeClassName:
      "bg-amber-100 text-amber-700 ring-amber-200",
    panelClassName:
      "border-amber-200 bg-amber-50 text-amber-800",
  },
  VERIFIED: {
    label: "Verificato",
    badgeClassName:
      "bg-emerald-100 text-emerald-700 ring-emerald-200",
    panelClassName:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  NOT_FOUND: {
    label: "Codice non trovato",
    badgeClassName:
      "bg-red-100 text-red-700 ring-red-200",
    panelClassName:
      "border-red-200 bg-red-50 text-red-800",
  },
  MISMATCH: {
    label: "Dati non coerenti",
    badgeClassName:
      "bg-orange-100 text-orange-700 ring-orange-200",
    panelClassName:
      "border-orange-200 bg-orange-50 text-orange-800",
  },
  REVIEW_REQUIRED: {
    label: "Richiede revisione",
    badgeClassName:
      "bg-violet-100 text-violet-700 ring-violet-200",
    panelClassName:
      "border-violet-200 bg-violet-50 text-violet-800",
  },
} as const;

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Salvataggio..." : "Salva codici"}
    </button>
  );
}

function VerificationButton({
  disabled,
}: {
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {pending
        ? "Richiesta in corso..."
        : "Verifica CIN e CIR"}
    </button>
  );
}

export function PropertyCodeSection({
  propertyId,
  cin,
  cir,
  verificationStatus,
  verifiedAt,
  verificationNotes,
  updateAction,
}: PropertyCodeSectionProps) {
  const router = useRouter();
  const status = STATUS[verificationStatus];
  const codesArePresent = Boolean(cin && cir);
  const verificationIsPending =
    verificationStatus === "PENDING";

  useEffect(() => {
    if (!verificationIsPending) {
      return;
    }

    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [router, verificationIsPending]);

  return (
    <section
      id="registrazione-alloggio"
      className="scroll-mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 bg-slate-50 px-8 py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
                ID
              </span>

              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Registrazione dell&apos;alloggio
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Inserisci il CIN e il CIR associati
                  all&apos;immobile.
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
              Horizon utilizzerà entrambi i codici per avviare il
              controllo di validità e coerenza dell&apos;alloggio.
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${status.badgeClassName}`}
          >
            {status.label}
          </span>
        </div>
      </div>

      <div className="space-y-8 p-8">
        <form
          action={updateAction}
          className="space-y-6"
        >
          <input
            type="hidden"
            name="propertyId"
            value={propertyId}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="property-cin"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Numero CIN
              </label>

              <input
                id="property-cin"
                name="cin"
                type="text"
                required
                autoComplete="off"
                defaultValue={cin ?? ""}
                placeholder="Inserisci il CIN"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm uppercase text-slate-950 outline-none transition placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Il codice verrà salvato automaticamente in maiuscolo
                e senza spazi.
              </p>
            </div>

            <div>
              <label
                htmlFor="property-cir"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Numero CIR
              </label>

              <input
                id="property-cir"
                name="cir"
                type="text"
                required
                autoComplete="off"
                defaultValue={cir ?? ""}
                placeholder="Inserisci il CIR"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm uppercase text-slate-950 outline-none transition placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Il formato può variare in base alla Regione.
              </p>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-6">
            <SaveButton />
          </div>
        </form>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Controllo incrociato
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Prima salva entrambi i codici. Successivamente puoi
                richiedere la verifica dell&apos;alloggio.
              </p>

              {verificationIsPending && (
                <p className="mt-3 text-xs font-medium text-amber-700">
                  La verifica è in elaborazione. Lo stato si
                  aggiornerà automaticamente.
                </p>
              )}
            </div>

            <form
              action={requestPropertyCodeVerificationAction}
            >
              <input
                type="hidden"
                name="propertyId"
                value={propertyId}
              />

              <VerificationButton
                disabled={
                  !codesArePresent || verificationIsPending
                }
              />
            </form>
          </div>

          {!codesArePresent && (
            <p className="mt-4 text-xs font-medium text-amber-700">
              Salva sia il CIN sia il CIR per abilitare la
              verifica.
            </p>
          )}
        </div>

        {(verificationNotes || verifiedAt) && (
          <div
            className={`rounded-2xl border p-5 ${status.panelClassName}`}
          >
            {verificationNotes && (
              <p className="text-sm leading-6">
                {verificationNotes}
              </p>
            )}

            {verifiedAt && (
              <p className="mt-3 text-xs font-medium">
                Ultima verifica:{" "}
                {new Intl.DateTimeFormat("it-IT", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(verifiedAt))}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}