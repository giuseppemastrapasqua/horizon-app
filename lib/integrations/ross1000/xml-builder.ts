import type {
  Ross1000Arrival,
  Ross1000Corrections,
  Ross1000Departure,
  Ross1000Movement,
  Ross1000Movements,
  Ross1000Reservation,
} from "./movement-types";
import { validateRoss1000Movements } from "./movement-validator";

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

function buildArrivalXml(arrival: Ross1000Arrival): string {
  return [
    "<arrivo>",
    element("idswh", arrival.idswh),
    element("tipoalloggiato", arrival.tipoAlloggiato),
    element("idcapo", arrival.idCapo),
    element("cognome", arrival.cognome),
    element("nome", arrival.nome),
    element("sesso", arrival.sesso),
    element("cittadinanza", arrival.cittadinanza),
    element("statoresidenza", arrival.statoResidenza),
    element("luogoresidenza", arrival.luogoResidenza),
    element("datanascita", arrival.dataNascita),
    element("statonascita", arrival.statoNascita),
    element("comunenascita", arrival.comuneNascita),
    element("tipoturismo", arrival.tipoTurismo),
    element("mezzotrasporto", arrival.mezzoTrasporto),
    element("canaleprenotazione", arrival.canalePrenotazione),
    element("titolostudio", arrival.titoloStudio),
    element("professione", arrival.professione),
    element("esenzioneimposta", arrival.esenzioneImposta),
    "</arrivo>",
  ].join("");
}

function buildDepartureXml(
  departure: Ross1000Departure,
): string {
  return [
    "<partenza>",
    element("idswh", departure.idswh),
    element("tipoalloggiato", departure.tipoAlloggiato),
    element("arrivo", departure.arrivo),
    "</partenza>",
  ].join("");
}

function buildReservationXml(
  reservation: Ross1000Reservation,
): string {
  return [
    "<prenotazione>",
    element("idswh", reservation.idswh),
    element("arrivo", reservation.arrivo),
    element("partenza", reservation.partenza),
    element("ospiti", reservation.ospiti),
    element("camere", reservation.camere),
    element(
      "prezzo",
      reservation.prezzo === undefined
        ? undefined
        : reservation.prezzo.toFixed(2),
    ),
    element(
      "canaleprenotazione",
      reservation.canalePrenotazione,
    ),
    element(
      "statoprovenienza",
      reservation.statoProvenienza,
    ),
    element(
      "comuneprovenienza",
      reservation.comuneProvenienza,
    ),
    "</prenotazione>",
  ].join("");
}

function buildCorrectionsXml(
  corrections: Ross1000Corrections,
): string {
  const eliminazioni = (corrections.eliminazioni ?? [])
    .map((item) =>
      [
        "<eliminazione>",
        element("idswh", item.idswh),
        element("tipoalloggiato", item.tipoAlloggiato),
        element("arrivo", item.arrivo),
        "</eliminazione>",
      ].join(""),
    )
    .join("");

  const cancellazioni = (corrections.cancellazioni ?? [])
    .map((item) =>
      [
        "<cancellazione>",
        element("idswh", item.idswh),
        element("arrivo", item.arrivo),
        "</cancellazione>",
      ].join(""),
    )
    .join("");

  const conferme = (corrections.conferme ?? [])
    .map((item) =>
      [
        "<conferma>",
        element("idswh", item.idswh),
        element("arrivo", item.arrivo),
        "</conferma>",
      ].join(""),
    )
    .join("");

  return [
    "<rettifiche>",
    eliminazioni,
    cancellazioni,
    conferme,
    "</rettifiche>",
  ].join("");
}

function buildMovementXml(
  movement: Ross1000Movement,
): string {
  const structure = movement.struttura;

  const arrivals =
    movement.arrivi && movement.arrivi.length > 0
      ? `<arrivi>${movement.arrivi
          .map(buildArrivalXml)
          .join("")}</arrivi>`
      : "";

  const departures =
    movement.partenze && movement.partenze.length > 0
      ? `<partenze>${movement.partenze
          .map(buildDepartureXml)
          .join("")}</partenze>`
      : "";

  const reservations =
    movement.prenotazioni &&
    movement.prenotazioni.length > 0
      ? `<prenotazioni>${movement.prenotazioni
          .map(buildReservationXml)
          .join("")}</prenotazioni>`
      : "";

  const corrections =
    movement.rettifiche &&
    ((movement.rettifiche.eliminazioni?.length ?? 0) > 0 ||
      (movement.rettifiche.cancellazioni?.length ?? 0) > 0 ||
      (movement.rettifiche.conferme?.length ?? 0) > 0)
      ? buildCorrectionsXml(movement.rettifiche)
      : "";

  return [
    "<movimento>",
    element("data", movement.data),
    "<struttura>",
    element("apertura", structure.apertura),
    element("camereoccupate", structure.camereOccupate),
    element(
      "cameredisponibili",
      structure.camereDisponibili,
    ),
    element("lettidisponibili", structure.lettiDisponibili),
    "</struttura>",
    arrivals,
    departures,
    reservations,
    corrections,
    "</movimento>",
  ].join("");
}

export function buildRoss1000Xml(
  input: Ross1000Movements,
): string {
  validateRoss1000Movements(input);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<movimenti>",
    element("codice", input.codice),
    element("prodotto", input.prodotto),
    input.movimenti.map(buildMovementXml).join(""),
    "</movimenti>",
  ].join("");
}

