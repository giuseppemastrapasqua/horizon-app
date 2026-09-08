import type { Metadata } from "next";

import { resolveGuestCheckInLink } from "@/lib/bookings/resolve-guest-check-in-link";
import { PublicAlloggiatiReferenceProvider } from "@/lib/integrations/alloggiati-web/public-reference-provider";

import { GuestCheckInForm } from "./GuestCheckInForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedina ospiti | Horizon",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

const referenceProvider = new PublicAlloggiatiReferenceProvider();

function formatDate(value: Date) {
  return value.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatInputDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function GuestCheckInPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const link = await resolveGuestCheckInLink(token);

  if (!link) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
            <div className="text-2xl font-extrabold text-blue-600">Horizon</div>
            <h1 className="mt-5 text-2xl font-bold text-slate-950">Link non disponibile</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Questo link non è valido oppure non è più disponibile. Contatta la struttura per ricevere un nuovo link.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { booking } = link;
  const referenceData = await referenceProvider.getData();

  const countries = referenceData.countries
    .map((item) => ({ name: item.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "it"));

  const documentTypes = referenceData.documentTypes
    .map((item) => ({ name: item.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "it"));

  const initialGuests = booking.bookingGuests.map((guest) => ({
    role: guest.role,
    firstName: guest.firstName,
    lastName: guest.lastName,
    gender: guest.gender,
    birthDate: formatInputDate(guest.birthDate),
    birthCity: guest.birthCity,
    birthProvince: guest.birthProvince,
    birthCountry: guest.birthCountry,
    citizenship: guest.citizenship,
    documentType: guest.documentType,
    documentNumber: guest.documentNumber,
    documentIssueCountry: guest.documentIssueCountry,
    documentIssueCity: guest.documentIssueCity,
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8">
          <div className="text-2xl font-extrabold text-blue-600">Horizon</div>

          <div className="mt-5">
            <p className="text-sm font-semibold text-blue-600">{booking.property.name}</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950">Dati ospiti per il soggiorno</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Inserisci i dati degli ospiti necessari alla registrazione del soggiorno.
            </p>
          </div>

          <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
            <div>
              <div className="font-medium text-slate-500">Prenotazione</div>
              <div className="mt-1 font-semibold text-slate-900">{booking.guestName}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium text-slate-500">Check-in</div>
                <div className="mt-1 font-semibold text-slate-900">{formatDate(booking.checkIn)}</div>
              </div>
              <div>
                <div className="font-medium text-slate-500">Check-out</div>
                <div className="mt-1 font-semibold text-slate-900">{formatDate(booking.checkOut)}</div>
              </div>
            </div>
            <div>
              <div className="font-medium text-slate-500">Numero ospiti</div>
              <div className="mt-1 font-semibold text-slate-900">{booking.guests}</div>
            </div>
          </div>

          <div className="mt-8">
            <GuestCheckInForm
              token={token}
              guestCount={booking.guests}
              initialGuests={initialGuests}
              countries={countries}
              documentTypes={documentTypes}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
