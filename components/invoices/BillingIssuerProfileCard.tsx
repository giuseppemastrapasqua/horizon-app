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
  "mt-2 w-full rounded-xl border border-white/[0.08] bg-[#07111A] px-4 py-3 text-[#E8E1D5] outline-none [color-scheme:dark] transition focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10";

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
    <section className="mb-6 rounded-[20px] border border-white/[0.07] bg-[#09131C]/90 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#D8B367]">
            Configurazione
          </p>
          <h2 className="mt-1 font-serif text-[16px] font-semibold tracking-[-0.02em] text-[#FFF8EA]">
            Dati emittente
          </h2>
          <p className="mt-1 text-[9px] text-[#82909C]">
            Profilo fiscale usato per le fatture commissioni Horizon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${complete ? "border border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300" : "border border-amber-400/20 bg-amber-400/[0.08] text-amber-300"}`}>
            {complete ? "Completi" : "Da completare"}
          </span>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="h-9 rounded-xl bg-[#D8B367] px-4 text-[9px] font-bold text-[#07111A] transition hover:bg-[#E3C37E]"
          >
            {open ? "Chiudi" : "Gestisci dati"}
          </button>
        </div>
      </div>

      {open ? (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 border-t border-white/[0.06] pt-5 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="text-[9px] font-bold text-[#A4AFB8]">Logo emittente</label>
            <div className="mt-2 flex items-center gap-4 rounded-xl border border-white/[0.07] bg-[#07111A] p-4">
              {profile?.logoPath ? (
                <img
                  src={profile.logoPath}
                  alt={`Logo ${profile.businessName}`}
                  className="h-14 max-w-40 object-contain"
                />
              ) : (
                <div className="flex h-14 min-w-40 items-center justify-center rounded-lg border border-white/[0.06] bg-[#09131C] px-4 text-[10px] font-bold text-[#82909C]">
                  {profile?.businessName || "Nessun logo"}
                </div>
              )}
              <div className="flex-1">
                <input
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg"
                  className="block w-full text-[9px] text-[#A4AFB8] file:mr-3 file:rounded-lg file:border-0 file:bg-[#D8B367]/10 file:px-3 file:py-2 file:font-bold file:text-[#D8B367]"
                />
                <p className="mt-1 text-[8px] text-[#6F7E8A]">PNG o JPEG, massimo 2 MB.</p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold text-[#A4AFB8]">Ragione sociale</label>
            <input name="businessName" required maxLength={160} defaultValue={profile?.businessName ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-[#A4AFB8]">Partita IVA</label>
            <input name="vatNumber" required maxLength={32} defaultValue={profile?.vatNumber ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-[#A4AFB8]">Codice fiscale</label>
            <input name="taxCode" maxLength={32} defaultValue={profile?.taxCode ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-[#A4AFB8]">PEC</label>
            <input name="pec" type="email" defaultValue={profile?.pec ?? ""} className={fieldClassName} />
          </div>

          <div className="md:col-span-2">
            <label className="text-[9px] font-bold text-[#A4AFB8]">Indirizzo fiscale</label>
            <input name="address" required maxLength={200} defaultValue={profile?.address ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-[#A4AFB8]">CAP</label>
            <input name="postalCode" required maxLength={20} defaultValue={profile?.postalCode ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-[#A4AFB8]">Città</label>
            <input name="city" required maxLength={120} defaultValue={profile?.city ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-[#A4AFB8]">Provincia</label>
            <input name="province" maxLength={80} defaultValue={profile?.province ?? ""} className={fieldClassName} />
          </div>

          <div>
            <label className="text-[9px] font-bold text-[#A4AFB8]">Paese</label>
            <input name="country" required minLength={2} maxLength={2} defaultValue={profile?.country ?? "IT"} className={fieldClassName} />
          </div>

          <div className="md:col-span-2">
            <label className="text-[9px] font-bold text-[#A4AFB8]">Email</label>
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
              className="rounded-xl bg-[#D8B367] px-5 py-3 text-[9px] font-bold text-[#07111A] transition hover:bg-[#E3C37E] disabled:opacity-60"
            >
              {isPending ? "Salvataggio..." : "Salva dati emittente"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
