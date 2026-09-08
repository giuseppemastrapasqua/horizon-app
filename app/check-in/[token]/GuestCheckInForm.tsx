"use client";

import { useState } from "react";

import { saveGuestCheckInAction } from "./actions";

type ReferenceOption = {
  name: string;
};

type InitialGuest = {
  role: "SINGLE_GUEST" | "FAMILY_HEAD" | "GROUP_HEAD" | "FAMILY_MEMBER" | "GROUP_MEMBER";
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE";
  birthDate: string;
  birthCity: string | null;
  birthProvince: string | null;
  birthCountry: string;
  citizenship: string;
  documentType: string | null;
  documentNumber: string | null;
  documentIssueCountry: string | null;
  documentIssueCity: string | null;
};

type Props = {
  token: string;
  guestCount: number;
  initialGuests: InitialGuest[];
  countries: ReferenceOption[];
  documentTypes: ReferenceOption[];
};

export function GuestCheckInForm({ token, guestCount, initialGuests, countries, documentTypes }: Props) {
  const initialLeader = initialGuests[0]?.role;
  const [groupType, setGroupType] = useState<"FAMILY" | "GROUP">(
    initialLeader === "GROUP_HEAD" ? "GROUP" : "FAMILY",
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.set("token", token);

      for (let index = 0; index < guestCount; index += 1) {
        const role = guestCount === 1
          ? "SINGLE_GUEST"
          : index === 0
            ? groupType === "FAMILY" ? "FAMILY_HEAD" : "GROUP_HEAD"
            : groupType === "FAMILY" ? "FAMILY_MEMBER" : "GROUP_MEMBER";
        formData.set(`guests.${index}.role`, role);
      }

      await saveGuestCheckInAction(formData);
      setSuccess(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Salvataggio non riuscito.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="font-bold text-emerald-950">Dati ospiti salvati</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          La schedina è stata compilata correttamente. Puoi chiudere questa pagina.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {guestCount > 1 ? (
        <fieldset className="rounded-2xl border border-slate-200 p-5">
          <legend className="px-2 text-sm font-bold text-slate-900">Tipo soggiorno</legend>
          <div className="mt-2 flex gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="radio" checked={groupType === "FAMILY"} onChange={() => setGroupType("FAMILY")} />
              Famiglia
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={groupType === "GROUP"} onChange={() => setGroupType("GROUP")} />
              Gruppo
            </label>
          </div>
        </fieldset>
      ) : null}

      {Array.from({ length: guestCount }, (_, index) => {
        const guest = initialGuests[index];
        const isLeader = index === 0;

        return (
          <fieldset key={index} className="rounded-2xl border border-slate-200 p-5">
            <legend className="px-2 font-bold text-slate-950">Ospite {index + 1}{isLeader ? " - intestatario" : ""}</legend>
            <input type="hidden" name={`guests.${index}.role`} />

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label="Nome"><input required name={`guests.${index}.firstName`} defaultValue={guest?.firstName ?? ""} className={inputClass} /></Field>
              <Field label="Cognome"><input required name={`guests.${index}.lastName`} defaultValue={guest?.lastName ?? ""} className={inputClass} /></Field>
              <Field label="Sesso"><select required name={`guests.${index}.gender`} defaultValue={guest?.gender ?? ""} className={inputClass}><option value="">Seleziona</option><option value="MALE">Maschio</option><option value="FEMALE">Femmina</option></select></Field>
              <Field label="Data di nascita"><input required type="date" name={`guests.${index}.birthDate`} defaultValue={guest?.birthDate ?? ""} className={inputClass} /></Field>
              <Field label="Paese di nascita"><CountrySelect required name={`guests.${index}.birthCountry`} value={guest?.birthCountry ?? ""} countries={countries} /></Field>
              <Field label="Cittadinanza"><CountrySelect required name={`guests.${index}.citizenship`} value={guest?.citizenship ?? ""} countries={countries} /></Field>
              <Field label="Comune di nascita (se nato in Italia)"><input name={`guests.${index}.birthCity`} defaultValue={guest?.birthCity ?? ""} className={inputClass} /></Field>
              <Field label="Provincia di nascita (sigla)"><input name={`guests.${index}.birthProvince`} defaultValue={guest?.birthProvince ?? ""} className={inputClass} maxLength={2} /></Field>
            </div>

            {isLeader ? (
              <div className="mt-5 border-t border-slate-200 pt-5">
                <p className="mb-4 text-sm font-bold text-slate-900">Documento</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tipo documento"><select required name={`guests.${index}.documentType`} defaultValue={guest?.documentType ?? ""} className={inputClass}><option value="">Seleziona</option>{documentTypes.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></Field>
                  <Field label="Numero documento"><input required name={`guests.${index}.documentNumber`} defaultValue={guest?.documentNumber ?? ""} className={inputClass} /></Field>
                  <Field label="Paese di rilascio"><CountrySelect required name={`guests.${index}.documentIssueCountry`} value={guest?.documentIssueCountry ?? ""} countries={countries} /></Field>
                  <Field label="Comune/località di rilascio"><input name={`guests.${index}.documentIssueCity`} defaultValue={guest?.documentIssueCity ?? ""} className={inputClass} /></Field>
                </div>
              </div>
            ) : null}
          </fieldset>
        );
      })}

      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}

      <button disabled={isSubmitting} type="submit" className="w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-50">
        {isSubmitting ? "Salvataggio..." : "Salva dati ospiti"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function CountrySelect({ name, value, countries, required }: { name: string; value: string; countries: ReferenceOption[]; required?: boolean }) {
  return (
    <select required={required} name={name} defaultValue={value} className={inputClass}>
      <option value="">Seleziona</option>
      {countries.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
    </select>
  );
}

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
