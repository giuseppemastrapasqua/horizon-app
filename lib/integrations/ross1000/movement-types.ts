export type Ross1000OpeningStatus = "SI" | "NO";

export const ROSS1000_TOURISM_TYPES = [
  "Culturale",
  "Balneare",
  "Congressuale/Affari",
  "Fieristico",
  "Sportivo/Fitness",
  "Scolastico",
  "Religioso",
  "Sociale",
  "Parchi Tematici",
  "Termale/Trattamenti salute",
  "Enogastronomico",
  "Cicloturismo",
  "Escursionistico/Naturalistico",
  "Altro motivo",
  "Non specificato",
] as const;

export type Ross1000TourismType =
  (typeof ROSS1000_TOURISM_TYPES)[number];

export const ROSS1000_TRANSPORT_TYPES = [
  "Auto",
  "Aereo",
  "Aereo+Pullman",
  "Aereo+Navetta/Taxi/Auto",
  "Aereo+Treno",
  "Treno",
  "Pullman",
  "Caravan/Autocaravan",
  "Barca/Nave/Traghetto",
  "Moto",
  "Bicicletta",
  "A piedi",
  "Altro mezzo",
  "Non Specificato",
] as const;

export type Ross1000TransportType =
  (typeof ROSS1000_TRANSPORT_TYPES)[number];

export const ROSS1000_BOOKING_CHANNELS = [
  "Diretta tradizionale",
  "Diretta web",
  "Indiretta tradizionale",
  "Indiretta web",
  "Altro canale",
  "Non specificato",
] as const;

export type Ross1000BookingChannel =
  (typeof ROSS1000_BOOKING_CHANNELS)[number];

export const ROSS1000_EDUCATION_LEVELS = [
  "Licenza elementare",
  "Diploma",
  "Laurea",
  "Altro titolo",
  "Non specificato",
] as const;

export type Ross1000EducationLevel =
  (typeof ROSS1000_EDUCATION_LEVELS)[number];

export type Ross1000Structure = {
  apertura: Ross1000OpeningStatus;
  camereOccupate: number;
  camereDisponibili: number;
  lettiDisponibili: number;
};

export type Ross1000Arrival = {
  idswh: string;
  tipoAlloggiato: string;
  idCapo?: string;
  cognome?: string;
  nome?: string;
  sesso: "M" | "F";
  cittadinanza: string;
  statoResidenza: string;
  luogoResidenza?: string;
  dataNascita: string;
  statoNascita?: string;
  comuneNascita?: string;
  tipoTurismo: Ross1000TourismType;
  mezzoTrasporto: Ross1000TransportType;
  canalePrenotazione?: Ross1000BookingChannel;
  titoloStudio?: Ross1000EducationLevel;
  professione?: string;
  esenzioneImposta?: string;
};

export type Ross1000Departure = {
  idswh: string;
  tipoAlloggiato: string;
  arrivo: string;
};

export type Ross1000Reservation = {
  idswh: string;
  arrivo: string;
  partenza: string;
  ospiti: number;
  camere: number;
  prezzo?: number;
  canalePrenotazione?: Ross1000BookingChannel;
  statoProvenienza?: string;
  comuneProvenienza?: string;
};

export type Ross1000Deletion = {
  idswh: string;
  tipoAlloggiato: string;
  arrivo: string;
};

export type Ross1000Cancellation = {
  idswh: string;
  arrivo: string;
};

export type Ross1000Confirmation = {
  idswh: string;
  arrivo: string;
};

export type Ross1000Corrections = {
  eliminazioni?: Ross1000Deletion[];
  cancellazioni?: Ross1000Cancellation[];
  conferme?: Ross1000Confirmation[];
};

export type Ross1000Movement = {
  data: string;
  struttura: Ross1000Structure;
  arrivi?: Ross1000Arrival[];
  partenze?: Ross1000Departure[];
  prenotazioni?: Ross1000Reservation[];
  rettifiche?: Ross1000Corrections;
};

export type Ross1000Movements = {
  codice: string;
  prodotto: string;
  movimenti: Ross1000Movement[];
};
