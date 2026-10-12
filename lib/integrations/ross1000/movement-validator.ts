import type {
  Ross1000Arrival,
  Ross1000Movements,
  Ross1000Reservation,
} from "./movement-types";

const ITALY_CODE = "100000100";

function requireText(
  value: string | undefined,
  field: string,
): void {
  if (!value?.trim()) {
    throw new Error(`ROSS1000: ${field} obbligatorio.`);
  }
}

function requireIdswh(value: string, field = "idswh"): void {
  requireText(value, field);

  if (value.length > 20) {
    throw new Error(
      `ROSS1000: ${field} supera 20 caratteri.`,
    );
  }
}

function requireDate(value: string, field: string): void {
  if (!/^\d{8}$/.test(value)) {
    throw new Error(
      `ROSS1000: ${field} deve essere nel formato aaaammgg.`,
    );
  }

  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(4, 6));
  const day = Number(value.slice(6, 8));

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`ROSS1000: ${field} non valida.`);
  }
}

function requireNonNegativeInteger(
  value: number,
  field: string,
): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`ROSS1000: ${field} non valido.`);
  }
}

function requirePositiveInteger(
  value: number,
  field: string,
): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`ROSS1000: ${field} non valido.`);
  }
}

function validateArrival(arrival: Ross1000Arrival): void {
  requireIdswh(arrival.idswh);
  requireText(
    arrival.tipoAlloggiato,
    "tipo alloggiato arrivo",
  );

  if (
    (arrival.tipoAlloggiato === "19" ||
      arrival.tipoAlloggiato === "20") &&
    !arrival.idCapo?.trim()
  ) {
    throw new Error(
      "ROSS1000: idcapo obbligatorio per componente famiglia/gruppo.",
    );
  }

  if (arrival.idCapo && arrival.idCapo.length > 20) {
    throw new Error(
      "ROSS1000: idcapo supera 20 caratteri.",
    );
  }

  requireText(arrival.sesso, "sesso");
  requireText(arrival.cittadinanza, "cittadinanza");
  requireText(arrival.statoResidenza, "stato residenza");
  requireDate(arrival.dataNascita, "data nascita");
  requireText(arrival.tipoTurismo, "tipo turismo");
  requireText(arrival.mezzoTrasporto, "mezzo trasporto");

  if (
    arrival.statoResidenza === ITALY_CODE &&
    !arrival.luogoResidenza?.trim()
  ) {
    throw new Error(
      "ROSS1000: luogo residenza obbligatorio per residente in Italia.",
    );
  }

  if (
    arrival.statoResidenza !== ITALY_CODE &&
    arrival.luogoResidenza &&
    arrival.luogoResidenza.length > 30
  ) {
    throw new Error(
      "ROSS1000: luogo residenza estero supera 30 caratteri.",
    );
  }

  if (
    arrival.statoNascita === ITALY_CODE &&
    !arrival.comuneNascita?.trim()
  ) {
    throw new Error(
      "ROSS1000: comune nascita obbligatorio per nato in Italia.",
    );
  }

  if (
    arrival.statoNascita &&
    arrival.statoNascita !== ITALY_CODE &&
    arrival.comuneNascita?.trim()
  ) {
    throw new Error(
      "ROSS1000: comune nascita deve essere vuoto per nato all'estero.",
    );
  }
}

function validateReservation(
  reservation: Ross1000Reservation,
): void {
  requireIdswh(reservation.idswh);
  requireDate(
    reservation.arrivo,
    "data arrivo prenotazione",
  );
  requireDate(
    reservation.partenza,
    "data partenza prenotazione",
  );
  requirePositiveInteger(
    reservation.ospiti,
    "ospiti prenotazione",
  );
  requirePositiveInteger(
    reservation.camere,
    "camere prenotazione",
  );

  if (
    reservation.prezzo !== undefined &&
    (!Number.isFinite(reservation.prezzo) ||
      reservation.prezzo < 0)
  ) {
    throw new Error(
      "ROSS1000: prezzo prenotazione non valido.",
    );
  }

  if (
    reservation.statoProvenienza === ITALY_CODE &&
    !reservation.comuneProvenienza?.trim()
  ) {
    throw new Error(
      "ROSS1000: comune provenienza obbligatorio per provenienza Italia.",
    );
  }

  if (
    reservation.statoProvenienza !== undefined &&
    reservation.statoProvenienza !== ITALY_CODE &&
    reservation.comuneProvenienza &&
    reservation.comuneProvenienza.length > 30
  ) {
    throw new Error(
      "ROSS1000: comune provenienza estero supera 30 caratteri.",
    );
  }
}

export function validateRoss1000Movements(
  input: Ross1000Movements,
): void {
  requireText(input.codice, "codice struttura");
  requireText(input.prodotto, "prodotto");

  if (input.movimenti.length === 0) {
    throw new Error(
      "ROSS1000: nessun movimento da esportare.",
    );
  }

  let previousDate: string | undefined;

  for (const movement of input.movimenti) {
    requireDate(movement.data, "data movimento");

    if (
      previousDate !== undefined &&
      movement.data < previousDate
    ) {
      throw new Error(
        "ROSS1000: movimenti non ordinati per data crescente.",
      );
    }

    previousDate = movement.data;

    const structure = movement.struttura;

    requireNonNegativeInteger(
      structure.camereOccupate,
      "camere occupate",
    );
    requireNonNegativeInteger(
      structure.camereDisponibili,
      "camere disponibili",
    );
    requireNonNegativeInteger(
      structure.lettiDisponibili,
      "letti disponibili",
    );

    if (
      structure.apertura === "NO" &&
      (structure.camereOccupate !== 0 ||
        structure.camereDisponibili !== 0 ||
        structure.lettiDisponibili !== 0)
    ) {
      throw new Error(
        "ROSS1000: struttura chiusa deve avere camere e letti a zero.",
      );
    }

    for (const arrival of movement.arrivi ?? []) {
      validateArrival(arrival);
    }

    for (const departure of movement.partenze ?? []) {
      requireIdswh(departure.idswh);
      requireText(
        departure.tipoAlloggiato,
        "tipo alloggiato partenza",
      );
      requireDate(
        departure.arrivo,
        "data arrivo della partenza",
      );
    }

    for (const reservation of movement.prenotazioni ?? []) {
      validateReservation(reservation);
    }

    for (
      const deletion of
      movement.rettifiche?.eliminazioni ?? []
    ) {
      requireIdswh(deletion.idswh);
      requireText(
        deletion.tipoAlloggiato,
        "tipo alloggiato eliminazione",
      );
      requireDate(
        deletion.arrivo,
        "data arrivo eliminazione",
      );
    }

    for (
      const cancellation of
      movement.rettifiche?.cancellazioni ?? []
    ) {
      requireIdswh(cancellation.idswh);
      requireDate(
        cancellation.arrivo,
        "data arrivo cancellazione",
      );
    }

    for (
      const confirmation of
      movement.rettifiche?.conferme ?? []
    ) {
      requireIdswh(confirmation.idswh);
      requireDate(
        confirmation.arrivo,
        "data arrivo conferma",
      );
    }
  }
}
