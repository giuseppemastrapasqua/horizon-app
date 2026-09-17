import type {
  SoggiorniamoGuestPresence,
  SoggiorniamoXmlInput,
} from "./types";

export type SoggiorniamoCanonicalGuest = {
  id: string;
  birthDate: Date;
  residenceCountryCode?: string;
  residenceCityCode?: string;
};

export type SoggiorniamoFiscalGuest = {
  guestId: string;
  guestTypeCode: number;
  tariff: number;
  taxAmount: number;
  intermediary?: string;
};

export type SoggiorniamoBookingInput = {
  bookingId: string;
  checkIn: Date;
  checkOut: Date;
  guests: SoggiorniamoCanonicalGuest[];
  fiscalGuests: SoggiorniamoFiscalGuest[];
};

export type SoggiorniamoStructureConfig = {
  municipalityCode: string;
  authCode: string;
  userCode: string;
  managerTaxCode: string;
  managerLastName: string;
  managerFirstName: string;
  structureId: string;
  structureName: string;
  unitId?: string;
};

function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function differenceInCalendarDays(
  start: Date,
  end: Date,
): number {
  const startUtc = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate(),
  );

  const endUtc = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate(),
  );

  return Math.round(
    (endUtc - startUtc) / 86_400_000,
  );
}

function quarterForMonth(month: number): number {
  return Math.floor((month - 1) / 3) + 1;
}

function requireFiscalGuest(
  guestId: string,
  fiscalGuests: SoggiorniamoFiscalGuest[],
): SoggiorniamoFiscalGuest {
  const matches = fiscalGuests.filter(
    (item) => item.guestId === guestId,
  );

  if (matches.length === 0) {
    throw new Error(
      `Soggiorniamo: classificazione IDS mancante per ospite ${guestId}.`,
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Soggiorniamo: classificazione IDS duplicata per ospite ${guestId}.`,
    );
  }

  return matches[0];
}

export function mapBookingToSoggiorniamoXmlInput(
  booking: SoggiorniamoBookingInput,
  config: SoggiorniamoStructureConfig,
): SoggiorniamoXmlInput {
  if (booking.guests.length === 0) {
    throw new Error(
      "Soggiorniamo: prenotazione senza ospiti.",
    );
  }

  const nights = differenceInCalendarDays(
    booking.checkIn,
    booking.checkOut,
  );

  if (nights < 1) {
    throw new Error(
      "Soggiorniamo: soggiorno con date non valide.",
    );
  }

  const checkInMonth =
    booking.checkIn.getUTCMonth() + 1;

  const year =
    booking.checkIn.getUTCFullYear();

  const presences: SoggiorniamoGuestPresence[] =
    booking.guests.map((guest) => {
      const fiscal = requireFiscalGuest(
        guest.id,
        booking.fiscalGuests,
      );

      return {
        guestTypeCode: fiscal.guestTypeCode,
        checkIn: isoDate(booking.checkIn),
        checkOut: isoDate(booking.checkOut),
        arrivals: 1,
        presences: nights,
        unitId: config.unitId,
        residenceCountryCode:
          guest.residenceCountryCode,
        residenceCityCode:
          guest.residenceCityCode,
        tariff: fiscal.tariff,
        intermediary: fiscal.intermediary,
        taxAmount: fiscal.taxAmount,
      };
    });

  const totalTax = booking.fiscalGuests.reduce(
    (sum, guest) => sum + guest.taxAmount,
    0,
  );

  const totalPayingPresences = presences
    .filter((presence) => presence.taxAmount > 0)
    .reduce(
      (sum, presence) =>
        sum + presence.presences,
      0,
    );

  const totalExemptGuests = presences.filter(
    (presence) => presence.taxAmount === 0,
  ).length;

  return {
    municipalityCode: config.municipalityCode,
    authCode: config.authCode,
    userCode: config.userCode,
    managerTaxCode: config.managerTaxCode,
    managerLastName: config.managerLastName,
    managerFirstName: config.managerFirstName,
    insertType: 2,
    structureId: config.structureId,
    structureName: config.structureName,
    declaration: {
      year,
      period: quarterForMonth(checkInMonth),
      totalArrivals: booking.guests.length,
      totalPayingPresences,
      totalExemptGuests,
      totalTax,
      months: [
        {
          month: checkInMonth,
          guests: presences,
        },
      ],
    },
  };
}
