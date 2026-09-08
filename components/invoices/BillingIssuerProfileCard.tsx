"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { upsertBillingIssuerProfileAction } from "@/app/invoices/billing-issuer-actions";

type BillingIssuerProfile = {
  businessName: string;
  vatNumber: string;
  taxCode: string | null;
  address: string;
  postalCode: string;
  city: string;
  province: string | null;
  country: string;
  email: string;
  pec: string | null;
  logoPath: string | null;
};

type Props = {
  profile: BillingIssuerProfile | null;
};

const fieldClassName =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10";

export function BillingIssuerProfileCard({ profile }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const complete = Boolean(
    profile?.businessName &&
      profile?.vatNumber &&
      profile?.address &&
      profile?.postalCode &&
      profile?.city &&
      profile?.country &&
      profile?.email,
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError("");

    startTransition(async () => {
      try {
        await upsertBillingIssuerProfileAction(formData);
        setOpen(false);
        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Impossibile salvare i dati emittente.",
        );
      }
    });
  }

  return (
    <section className="mb-6 rounded-[20px] border border-blue-100 bg-blue-50/50 p-5 shadow-[0_8px_26px_rgba(15,23,42,0.045)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.14em] text-blue-600">
            Configurazione
          </p>
          <h2 className="mt-1 text-[16px] font-black tracking-[-0.03em] text-slate-950">
            Dati emittente
          </h2>
          <p className="mt-1 text-[9px] text-slate-500">
            Profilo fiscale usato per le fatture commissioni Horizon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {complete ? "Completi" : "Da completare"}
          </span>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="h-9 rounded-xl bg-blue-600 px-4 text-[9px] font-bold text-white transition hover:bg-blue-700"
          >
            {open ? "Chiudi" : "Gestisci dati"}
          </button>
        </div>
      </div>

      {open ? (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 border-t border-blue-100 pt-5 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="text-[9px] font-bold text-slate-600">Logo emittente</label>
            <div className="mt-2 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
              {profile?.logoPath ? (
                <img
                  src={profile.logoPath}
                  alt={`Logo ${profile.businessName}`}
                  className="h-14 max-w-40 object-contain"
                />
              ) : (
                <div className="flex h-14 min-w-40 items-center justify-center rounded-lg bg-slate-50 px-4 text-[10px] font-bold text-slate-500">
                  {profile?.businessName || "Nessun logo"}
                </div>
              )}
              <div className="flex-1">
                <input
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg"
                  className="block w-full text-[9px] text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700"
                />
                <p className="mt-1 text-[8px] text-slate-400">PNG o JPEG, massimo 2 MB.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-600">Ragione sociale</label>
            <input name="businessName" required maxLength={160} defaultValue={profile?.businessName ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-600">Partita IVA</label>
            <input name="vatNumber" required maxLength={32} defaultValue={profile?.vatNumber ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-600">Codice fiscale</label>
            <input name="taxCode" maxLength={32} defaultValue={profile?.taxCode ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-600">PEC</label>
            <input name="pec" type="email" defaultValue={profile?.pec ?? ""} className={fieldClassName} />
          </div>

          <div className="md:col-span-2">
            <label className="text-[9px] font-bold text-slate-600">Indirizzo fiscale</label>
            <input name="address" required maxLength={200} defaultValue={profile?.address ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-600">CAP</label>
            <input name="postalCode" required maxLength={20} defaultValue={profile?.postalCode ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-600">Città</label>
            <input name="city" required maxLength={120} defaultValue={profile?.city ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-600">Provincia</label>
            <input name="province" maxLength={80} defaultValue={profile?.province ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-slate-600">Paese</label>
            <input name="country" required minLength={2} maxLength={2} defaultValue={profile?.country ?? "IT"} className={fieldClassName} />
          </div>

          <div className="md:col-span-2">
            <label className="text-[9px] font-bold text-slate-600">Email</label>
            <input name="email" type="email" required defaultValue={profile?.email ?? ""} className={fieldClassName} />
          </div>

          {error ? (
            <p className="md:col-span-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[9px] text-red-700">
              {error}
            </p>
          ) : null}

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-blue-600 px-5 py-3 text-[9px] font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? "Salvataggio..." : "Salva dati emittente"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
