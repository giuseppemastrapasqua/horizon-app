import type {
  SoggiorniamoGuestPresence,
  SoggiorniamoXmlInput,
} from "./types";

function requireText(value: string | undefined, field: string) {
  if (!value?.trim()) {
    throw new Error(`Soggiorniamo: ${field} obbligatorio.`);
  }
}

function requireNonNegativeInteger(value: number, field: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`Soggiorniamo: ${field} non valido.`);
  }
}

function requireMoney(value: number, field: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Soggiorniamo: ${field} non valido.`);
  }
}

function validatePresence(
  presence: SoggiorniamoGuestPresence,
  insertType: 1 | 2,
) {
  if (!Number.isInteger(presence.guestTypeCode) || presence.guestTypeCode < 1) {
    throw new Error("Soggiorniamo: ID tipologia ospite non valido.");
  }

  if (
    presence.stayBand !== undefined &&
    (!Number.isInteger(presence.stayBand) || presence.stayBand < 1)
  ) {
    throw new Error("Soggiorniamo: fascia soggiorno non valida.");
  }

  requireNonNegativeInteger(presence.arrivals, "arrivi");
  requireNonNegativeInteger(presence.presences, "presenze");
  requireMoney(presence.tariff, "tariffa");
  requireMoney(presence.taxAmount, "imposta");

  if (insertType === 2) {
    requireText(presence.checkIn, "data check-in");
    requireText(presence.checkOut, "data check-out");
  }
}

export function validateSoggiorniamoXmlInput(
  input: SoggiorniamoXmlInput,
): void {
  requireText(input.municipalityCode, "codice Comune");
  requireText(input.authCode, "Codice Auth");
  requireText(input.userCode, "Codice Utente");

  requireText(input.managerTaxCode, "codice fiscale gestore");
  requireText(input.managerLastName, "cognome gestore");
  requireText(input.managerFirstName, "nome gestore");

  requireText(input.structureId, "Codice struttura");
  requireText(input.structureName, "insegna struttura");

  if (input.insertType !== 1 && input.insertType !== 2) {
    throw new Error("Soggiorniamo: tipo inserimento non valido.");
  }

  const declaration = input.declaration;

  if (!Number.isInteger(declaration.year) || declaration.year < 2000) {
    throw new Error("Soggiorniamo: anno non valido.");
  }

  if (
    !Number.isInteger(declaration.period) ||
    declaration.period < 1 ||
    declaration.period > 4
  ) {
    throw new Error("Soggiorniamo: periodo trimestrale non valido.");
  }

  requireNonNegativeInteger(declaration.totalArrivals, "totale arrivi");
  requireNonNegativeInteger(
    declaration.totalPayingPresences,
    "totale presenze paganti",
  );
  requireNonNegativeInteger(
    declaration.totalExemptGuests,
    "totale ospiti esenti",
  );
  requireMoney(declaration.totalTax, "totale imposta");

  if (declaration.months.length === 0) {
    throw new Error("Soggiorniamo: nessun mese da esportare.");
  }

  for (const month of declaration.months) {
    if (!Number.isInteger(month.month) || month.month < 1 || month.month > 12) {
      throw new Error("Soggiorniamo: numero mese non valido.");
    }

    if (month.guests.length === 0) {
      throw new Error(
        `Soggiorniamo: nessuna presenza per il mese ${month.month}.`,
      );
    }

    for (const presence of month.guests) {
      validatePresence(presence, input.insertType);
    }
  }
}
