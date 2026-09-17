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
      <main className="flex min-h-screen items-center justify-center bg-[#050B11] px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="rounded-3xl border border-[#D8B367]/20 bg-[#09131C] p-8 shadow-xl shadow-black/30">
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#D8B367]">Horizon</div>
            <h1 className="mt-5 font-serif text-3xl font-normal text-[#FFF8EA]">Link non disponibile</h1>
            <p className="mt-3 text-sm leading-6 text-[#8EA0AE]">
              Questo link non Ã¨ valido oppure non Ã¨ piÃ¹ disponibile. Contatta la struttura per ricevere un nuovo link.
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
    residenceCountry: guest.residenceCountry,
    residenceCity: guest.residenceCity,
    residenceProvince: guest.residenceProvince,
    documentType: guest.documentType,
    documentNumber: guest.documentNumber,
    documentIssueCountry: guest.documentIssueCountry,
    documentIssueCity: guest.documentIssueCity,
  }));

  return (
    <main className="min-h-screen bg-[#050B11] px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-[#D8B367]/20 bg-[#09131C] p-6 shadow-xl shadow-black/30 sm:p-8">
          <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[#D8B367]">Horizon</div>

          <div className="mt-5">
            <GuestCheckInForm
              token={token}
              propertyName={booking.property.name}
              guestName={booking.guestName}
              checkIn={formatInputDate(booking.checkIn)}
              checkOut={formatInputDate(booking.checkOut)}
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
