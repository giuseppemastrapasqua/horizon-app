"use client";

import { useEffect, useState } from "react";

import { saveGuestCheckInAction } from "./actions";
import { guestCheckInLanguageLabels, guestCheckInLanguages, guestCheckInTranslations, isGuestCheckInLanguage, type GuestCheckInLanguage } from "./translations";

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
  residenceCountry?: string | null;
  residenceCity?: string | null;
  residenceProvince?: string | null;
  documentType: string | null;
  documentNumber: string | null;
  documentIssueCountry: string | null;
  documentIssueCity: string | null;
};

type Props = {
  token: string;
  propertyName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  initialGuests: InitialGuest[];
  countries: ReferenceOption[];
  documentTypes: ReferenceOption[];
};

export function GuestCheckInForm({ token, propertyName, guestName, checkIn, checkOut, guestCount, initialGuests, countries, documentTypes }: Props) {
  const [language, setLanguage] = useState<GuestCheckInLanguage>("it");
  const t = guestCheckInTranslations[language];
  const locale = { it: "it-IT", en: "en-GB", es: "es-ES", fr: "fr-FR", pt: "pt-PT" }[language];
  const formatStayDate = (value: string) => new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00.000Z`));

  useEffect(() => {
    const stored = window.localStorage.getItem("horizon-guest-check-in-language");
    if (stored && isGuestCheckInLanguage(stored)) {
      setLanguage(stored);
      return;
    }

    const browserLanguage = window.navigator.language.toLowerCase().split("-")[0];
    if (isGuestCheckInLanguage(browserLanguage)) {
      setLanguage(browserLanguage);
    }
  }, []);

  function changeLanguage(value: string) {
    if (!isGuestCheckInLanguage(value)) return;
    setLanguage(value);
    window.localStorage.setItem("horizon-guest-check-in-language", value);
  }
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
      formData.set("language", language);

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
      setError(cause instanceof Error ? cause.message : t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="font-bold text-emerald-950">{t.saved}</h2>
        <p className="mt-2 text-sm leading-6 text-emerald-800">
          {t.savedText}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-[#D8B367]">{propertyName}</p>
        <h1 className="mt-2 font-serif text-3xl font-normal text-[#FFF8EA]">{t.title}</h1>
        <p className="mt-3 text-sm leading-6 text-[#8EA0AE]">{t.intro}</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#07111A] p-5 text-sm">
        <div>
          <div className="font-medium text-[#8EA0AE]">{t.booking}</div>
          <div className="mt-1 font-semibold text-[#FFF8EA]">{guestName}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-medium text-[#8EA0AE]">{t.checkIn}</div>
            <div className="mt-1 font-semibold text-[#FFF8EA]">{formatStayDate(checkIn)}</div>
          </div>
          <div>
            <div className="font-medium text-[#8EA0AE]">{t.checkOut}</div>
            <div className="mt-1 font-semibold text-[#FFF8EA]">{formatStayDate(checkOut)}</div>
          </div>
        </div>
        <div>
          <div className="font-medium text-[#8EA0AE]">{t.guestCount}</div>
          <div className="mt-1 font-semibold text-[#FFF8EA]">{guestCount}</div>
        </div>
      </div>
      <div className="flex justify-end">
        <label className="w-full max-w-48">
          <span className="mb-1.5 block text-sm font-medium text-[#FFF8EA]">{t.language}</span>
          <select aria-label={t.language} value={language} onChange={(event) => changeLanguage(event.target.value)} className={inputClass}>
            {guestCheckInLanguages.map((item) => (
              <option key={item} value={item}>{guestCheckInLanguageLabels[item]}</option>
            ))}
          </select>
        </label>
      </div>
      {guestCount > 1 ? (
        <fieldset className="rounded-2xl border border-[#D8B367]/15 bg-[#07111A] p-5 shadow-sm">
          <legend className="px-2 text-sm font-semibold text-[#C8D1D8]">{t.stayType}</legend>
          <div className="mt-2 flex flex-wrap gap-5 text-sm font-medium text-[#C8D1D8]">
            <label className="flex items-center gap-2">
              <input type="radio" checked={groupType === "FAMILY"} onChange={() => setGroupType("FAMILY")} className="h-4 w-4 accent-slate-900" />
              {t.family}
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" checked={groupType === "GROUP"} onChange={() => setGroupType("GROUP")} className="h-4 w-4 accent-slate-900" />
              {t.group}
            </label>
          </div>
        </fieldset>
      ) : null}

      {Array.from({ length: guestCount }, (_, index) => {
        const guest = initialGuests[index];
        const isLeader = index === 0;

        return (
          <fieldset key={index} className="rounded-2xl border border-[#D8B367]/15 bg-[#07111A] p-5 shadow-sm">
            <legend className="px-2 font-semibold text-[#FFF8EA]">{t.guest} {index + 1}{isLeader ? ` - ${t.leader}` : ""}</legend>
            <input type="hidden" name={`guests.${index}.role`} />

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <Field label={t.firstName}><input required name={`guests.${index}.firstName`} defaultValue={guest?.firstName ?? ""} className={inputClass} /></Field>
              <Field label={t.lastName}><input required name={`guests.${index}.lastName`} defaultValue={guest?.lastName ?? ""} className={inputClass} /></Field>
              <Field label={t.gender}><select required name={`guests.${index}.gender`} defaultValue={guest?.gender ?? ""} className={inputClass}><option value="">{t.select}</option><option value="MALE">{t.male}</option><option value="FEMALE">{t.female}</option></select></Field>
              <Field label={t.birthDate}><input required type="date" name={`guests.${index}.birthDate`} defaultValue={guest?.birthDate ?? ""} className={inputClass} /></Field>
              <Field label={t.birthCountry}><CountrySelect required name={`guests.${index}.birthCountry`} value={guest?.birthCountry ?? ""} countries={countries} selectLabel={t.select} /></Field>
              <Field label={t.citizenship}><CountrySelect required name={`guests.${index}.citizenship`} value={guest?.citizenship ?? ""} countries={countries} selectLabel={t.select} /></Field>
              <Field label="Paese di residenza"><CountrySelect required name={`guests.${index}.residenceCountry`} value={guest?.residenceCountry ?? ""} countries={countries} selectLabel={t.select} /></Field>
              <Field label="Comune / città di residenza"><input name={`guests.${index}.residenceCity`} defaultValue={guest?.residenceCity ?? ""} className={inputClass} /></Field>
              <Field label="Provincia di residenza (se Italia)"><input name={`guests.${index}.residenceProvince`} defaultValue={guest?.residenceProvince ?? ""} className={inputClass} maxLength={2} /></Field>
              <Field label={t.birthCity}><input name={`guests.${index}.birthCity`} defaultValue={guest?.birthCity ?? ""} className={inputClass} /></Field>
              <Field label={t.birthProvince}><input name={`guests.${index}.birthProvince`} defaultValue={guest?.birthProvince ?? ""} className={inputClass} maxLength={2} /></Field>
            </div>

            {isLeader ? (
              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="mb-4 text-sm font-bold text-[#FFF8EA]">{t.document}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t.documentType}><select required name={`guests.${index}.documentType`} defaultValue={guest?.documentType ?? ""} className={inputClass}><option value="">{t.select}</option>{documentTypes.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</select></Field>
                  <Field label={t.documentNumber}><input required name={`guests.${index}.documentNumber`} defaultValue={guest?.documentNumber ?? ""} className={inputClass} /></Field>
                  <Field label={t.documentIssueCountry}><CountrySelect required name={`guests.${index}.documentIssueCountry`} value={guest?.documentIssueCountry ?? ""} countries={countries} selectLabel={t.select} /></Field>
                  <Field label={t.documentIssueCity}><input name={`guests.${index}.documentIssueCity`} defaultValue={guest?.documentIssueCity ?? ""} className={inputClass} /></Field>
                </div>
              </div>
            ) : null}
          </fieldset>
        );
      })}

      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</p> : null}

      <button disabled={isSubmitting} type="submit" className="w-full rounded-xl bg-[#D8B367] px-5 py-3 font-bold text-[#07111A] disabled:opacity-50">
        {isSubmitting ? t.saving : t.save}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-sm font-medium text-[#FFF8EA]">{label}</span>{children}</label>;
}

function CountrySelect({ name, value, countries, required, selectLabel }: { name: string; value: string; countries: ReferenceOption[]; required?: boolean; selectLabel: string }) {
  return (
    <select required={required} name={name} defaultValue={value} className={inputClass}>
      <option value="">{selectLabel}</option>
      {countries.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
    </select>
  );
}

const inputClass = "w-full rounded-xl border border-white/15 bg-[#0D1923] px-3 py-2.5 text-sm text-[#FFF8EA] outline-none focus:border-[#D8B367] focus:ring-2 focus:ring-[#D8B367]/15";
