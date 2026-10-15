import type { AlloggiatiReferenceResolver } from "../alloggiati-web/reference-resolver";
import { toAlloggiatiGuestTypeCode } from "../alloggiati-web/guest-role-code";

import {
  ROSS1000_TOURISM_TYPES,
  ROSS1000_TRANSPORT_TYPES,
  type Ross1000Arrival,
  type Ross1000Movements,
  type Ross1000TourismType,
  type Ross1000TransportType,
} from "./movement-types";
import type {
  Ross1000MovementBookingInput,
  Ross1000MovementGeneratorInput,
  Ross1000MovementGuestInput,
} from "./movement-generator-types";
import { validateRoss1000Movements } from "./movement-validator";

function formatRoss1000Date(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function isSameRoss1000Day(left: Date, right: Date): boolean {
  return formatRoss1000Date(left) === formatRoss1000Date(right);
}

function requireTourismType(value: string): Ross1000TourismType {
  if (
    !ROSS1000_TOURISM_TYPES.includes(
      value as Ross1000TourismType,
    )
  ) {
    throw new Error(
      `ROSS1000: tipo turismo non valido: ${value}.`,
    );
  }

  return value as Ross1000TourismType;
}

function requireTransportType(
  value: string,
): Ross1000TransportType {
  if (
    !ROSS1000_TRANSPORT_TYPES.includes(
      value as Ross1000TransportType,
    )
  ) {
    throw new Error(
      `ROSS1000: mezzo di trasporto non valido: ${value}.`,
    );
  }

  return value as Ross1000TransportType;
}

async function requireCode(
  value: Promise<string | null>,
  label: string,
): Promise<string> {
  const code = await value;

  if (!code) {
    throw new Error(`ROSS1000: riferimento non risolto: ${label}.`);
  }

  return code;
}

function findLeader(
  booking: Ross1000MovementBookingInput,
  guest: Ross1000MovementGuestInput,
): Ross1000MovementGuestInput | null {
  if (guest.role === "FAMILY_MEMBER") {
    return (
      booking.bookingGuests.find(
        (candidate) => candidate.role === "FAMILY_HEAD",
      ) ?? null
    );
  }

  if (guest.role === "GROUP_MEMBER") {
    return (
      booking.bookingGuests.find(
        (candidate) => candidate.role === "GROUP_HEAD",
      ) ?? null
    );
  }

  return null;
}

function validateGuestTopology(
  booking: Ross1000MovementBookingInput,
): void {
  const familyHeads = booking.bookingGuests.filter(
    (guest) => guest.role === "FAMILY_HEAD",
  );
  const groupHeads = booking.bookingGuests.filter(
    (guest) => guest.role === "GROUP_HEAD",
  );
  const singleGuests = booking.bookingGuests.filter(
    (guest) => guest.role === "SINGLE_GUEST",
  );

  if (singleGuests.length > 0) {
    if (
      booking.bookingGuests.length !== 1 ||
      singleGuests.length !== 1
    ) {
      throw new Error(
        `ROSS1000: struttura ospiti non valida per booking ${booking.id}.`,
      );
    }

    return;
  }

  if (familyHeads.length > 0 && groupHeads.length > 0) {
    throw new Error(
      `ROSS1000: booking ${booking.id} contiene contemporaneamente famiglia e gruppo.`,
    );
  }

  if (familyHeads.length > 1 || groupHeads.length > 1) {
    throw new Error(
      `ROSS1000: booking ${booking.id} contiene più capigruppo/capifamiglia.`,
    );
  }

  for (const guest of booking.bookingGuests) {
    if (
      guest.role === "FAMILY_MEMBER" &&
      familyHeads.length !== 1
    ) {
      throw new Error(
        `ROSS1000: componente famiglia senza capofamiglia nel booking ${booking.id}.`,
      );
    }

    if (
      guest.role === "GROUP_MEMBER" &&
      groupHeads.length !== 1
    ) {
      throw new Error(
        `ROSS1000: componente gruppo senza capogruppo nel booking ${booking.id}.`,
      );
    }

    if (
      familyHeads.length === 1 &&
      guest.role === "GROUP_MEMBER"
    ) {
      throw new Error(
        `ROSS1000: componente gruppo associato a una famiglia nel booking ${booking.id}.`,
      );
    }

    if (
      groupHeads.length === 1 &&
      guest.role === "FAMILY_MEMBER"
    ) {
      throw new Error(
        `ROSS1000: componente famiglia associato a un gruppo nel booking ${booking.id}.`,
      );
    }
  }
}

async function buildArrival(
  booking: Ross1000MovementBookingInput,
  guest: Ross1000MovementGuestInput,
  resolver: AlloggiatiReferenceResolver,
): Promise<Ross1000Arrival> {
  const leader = findLeader(booking, guest);

  const citizenship = await requireCode(
    resolver.resolveCountryCode(guest.citizenship),
    `cittadinanza ${guest.citizenship}`,
  );

  if (!guest.residenceCountry?.trim()) {
    throw new Error(
      `ROSS1000: stato di residenza mancante per ospite ${guest.id}.`,
    );
  }

  const residenceCountry = await requireCode(
    resolver.resolveCountryCode(guest.residenceCountry),
    `stato di residenza ${guest.residenceCountry}`,
  );

  const birthCountry = await requireCode(
    resolver.resolveCountryCode(guest.birthCountry),
    `stato di nascita ${guest.birthCountry}`,
  );

  const isItalianResidence = await resolver.isItaly(
    guest.residenceCountry,
  );
  const isItalianBirth = await resolver.isItaly(
    guest.birthCountry,
  );

  let luogoResidenza: string | undefined;

  if (isItalianResidence) {
    if (!guest.residenceCity?.trim()) {
      throw new Error(
        `ROSS1000: comune di residenza mancante per ospite ${guest.id}.`,
      );
    }

    luogoResidenza = await requireCode(
      resolver.resolveMunicipalityCode(
        guest.residenceCity,
        guest.residenceProvince,
      ),
      `comune di residenza ${guest.residenceCity}`,
    );
  } else if (guest.residenceCity?.trim()) {
    luogoResidenza = guest.residenceCity.trim();
  }

  let comuneNascita: string | undefined;

  if (isItalianBirth) {
    if (!guest.birthCity?.trim()) {
      throw new Error(
        `ROSS1000: comune di nascita mancante per ospite ${guest.id}.`,
      );
    }

    comuneNascita = await requireCode(
      resolver.resolveMunicipalityCode(
        guest.birthCity,
        guest.birthProvince,
      ),
      `comune di nascita ${guest.birthCity}`,
    );
  }

  return {
    idswh: guest.ross1000Idswh,
    tipoAlloggiato: toAlloggiatiGuestTypeCode(guest.role),
    ...(leader
      ? { idCapo: leader.ross1000Idswh }
      : {}),
    cognome: guest.lastName,
    nome: guest.firstName,
    sesso: guest.gender === "MALE" ? "M" : "F",
    cittadinanza: citizenship,
    statoResidenza: residenceCountry,
    ...(luogoResidenza ? { luogoResidenza } : {}),
    dataNascita: formatRoss1000Date(guest.birthDate),
    statoNascita: birthCountry,
    ...(comuneNascita ? { comuneNascita } : {}),
    tipoTurismo: requireTourismType(booking.tourismType),
    mezzoTrasporto: requireTransportType(
      booking.transportType,
    ),
  };
}

export async function generateRoss1000Movements(
  input: Ross1000MovementGeneratorInput,
  resolver: AlloggiatiReferenceResolver,
): Promise<Ross1000Movements> {
  const arrivalsBookings = input.bookings.filter((booking) =>
    isSameRoss1000Day(booking.checkIn, input.movementDate),
  );

  const departureBookings = input.bookings.filter((booking) =>
    isSameRoss1000Day(booking.checkOut, input.movementDate),
  );

  const activeBookings = input.bookings.filter(
    (booking) =>
      formatRoss1000Date(booking.checkIn) <=
        formatRoss1000Date(input.movementDate) &&
      formatRoss1000Date(booking.checkOut) >
        formatRoss1000Date(input.movementDate),
  );

  const arrivals: Ross1000Arrival[] = [];

  for (const booking of arrivalsBookings) {
    validateGuestTopology(booking);

    if (booking.bookingGuests.length !== booking.guests) {
      throw new Error(
        `ROSS1000: numero ospiti incoerente nel booking ${booking.id}.`,
      );
    }

    for (const guest of booking.bookingGuests) {
      arrivals.push(
        await buildArrival(booking, guest, resolver),
      );
    }
  }

  const departures = departureBookings.flatMap((booking) => {
    validateGuestTopology(booking);

    return booking.bookingGuests.map((guest) => ({
      idswh: guest.ross1000Idswh,
      tipoAlloggiato: toAlloggiatiGuestTypeCode(guest.role),
      arrivo: formatRoss1000Date(booking.checkIn),
    }));
  });

  const roomsOccupied = activeBookings.reduce(
    (total, booking) => total + booking.roomsOccupied,
    0,
  );

  if (
    !input.property.isOpen &&
    (
      activeBookings.length > 0 ||
      arrivals.length > 0 ||
      departures.length > 0
    )
  ) {
    throw new Error(
      "ROSS1000: struttura chiusa con movimenti o soggiorni attivi.",
    );
  }

  if (
    input.property.isOpen &&
    roomsOccupied > input.property.roomsAvailable
  ) {
    throw new Error(
      "ROSS1000: camere occupate superiori alle camere disponibili.",
    );
  }

  const result: Ross1000Movements = {
    codice: input.property.structureCode,
    prodotto: input.product,
    movimenti: [
      {
        data: formatRoss1000Date(input.movementDate),
        struttura: input.property.isOpen
          ? {
              apertura: "SI",
              camereOccupate: roomsOccupied,
              camereDisponibili: input.property.roomsAvailable,
              lettiDisponibili: input.property.bedsAvailable,
            }
          : {
              apertura: "NO",
              camereOccupate: 0,
              camereDisponibili: 0,
              lettiDisponibili: 0,
            },
        ...(arrivals.length > 0 ? { arrivi: arrivals } : {}),
        ...(departures.length > 0
          ? { partenze: departures }
          : {}),
      },
    ],
  };

  validateRoss1000Movements(result);

  return result;
}
