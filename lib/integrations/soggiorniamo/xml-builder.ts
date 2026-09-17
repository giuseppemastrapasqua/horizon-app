import type {
  SoggiorniamoGuestPresence,
  SoggiorniamoXmlInput,
} from "./types";
import { validateSoggiorniamoXmlInput } from "./validator";

function escapeXml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function element(
  name: string,
  value: string | number | undefined,
): string {
  return `<${name}>${value === undefined ? "" : escapeXml(value)}</${name}>`;
}

function money(value: number): string {
  return value.toFixed(2);
}

function buildGuestXml(
  guest: SoggiorniamoGuestPresence,
  insertType: 1 | 2,
): string {
  return [
    "<ospite>",
    element("ID_tipologia", guest.guestTypeCode),
    element("num_fascia", guest.stayBand),
    element(
      "data_checkin",
      insertType === 2 ? guest.checkIn : undefined,
    ),
    element(
      "data_checkout",
      insertType === 2 ? guest.checkOut : undefined,
    ),
    element("arrivi", guest.arrivals),
    element("presenze", guest.presences),
    element("ID_unita", guest.unitId),
    element("statoResidenza", guest.residenceCountryCode),
    element("cittaResidenza", guest.residenceCityCode),
    element("tariffa", money(guest.tariff)),
    element("intermediario", guest.intermediary),
    element("incassato", "on"),
    element("imposta", money(guest.taxAmount)),
    "</ospite>",
  ].join("");
}

export function buildSoggiorniamoXml(
  input: SoggiorniamoXmlInput,
): string {
  validateSoggiorniamoXmlInput(input);

  const declaration = input.declaration;

  const monthsXml = declaration.months
    .map(
      (month) =>
        [
          "<mese>",
          element("num_mese", month.month),
          "<ospiti>",
          month.guests
            .map((guest) => buildGuestXml(guest, input.insertType))
            .join(""),
          "</ospiti>",
          "</mese>",
        ].join(""),
    )
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<dichiarazioni>",
    element("comune", input.municipalityCode),
    "<utenti>",
    "<utente>",
    element("auth", input.authCode),
    element("codice_utente", input.userCode),
    element("gest_codice_fiscale", input.managerTaxCode),
    element("gest_cognome", input.managerLastName),
    element("gest_nome", input.managerFirstName),
    element("tipo_insert_dati", input.insertType),
    "<strutture>",
    "<struttura>",
    element("ID_struttura", input.structureId),
    element("insegna", input.structureName),
    "<dichiarazioni>",
    "<dichiarazione>",
    element("dic_anno", declaration.year),
    element("dic_periodo", declaration.period),
    element("dic_tot_arrivi", declaration.totalArrivals),
    element(
      "dic_tot_presenze",
      declaration.totalPayingPresences,
    ),
    element("dic_tot_esenti", declaration.totalExemptGuests),
    element("dic_tot_imposta", money(declaration.totalTax)),
    "<mesi>",
    monthsXml,
    "</mesi>",
    "</dichiarazione>",
    "</dichiarazioni>",
    "</struttura>",
    "</strutture>",
    "</utente>",
    "</utenti>",
    "</dichiarazioni>",
  ].join("");
}
