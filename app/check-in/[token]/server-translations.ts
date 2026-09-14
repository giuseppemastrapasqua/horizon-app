import { isGuestCheckInLanguage, type GuestCheckInLanguage } from "./translations";

export type GuestCheckInServerErrorKey =
  | "required"
  | "invalidBirthDate"
  | "invalidGender"
  | "invalidRole"
  | "invalidLink"
  | "incomplete"
  | "alreadySent"
  | "birthCountry"
  | "citizenship"
  | "italyBirthPlace"
  | "municipality"
  | "documentType"
  | "documentIssueCountry";

const messages: Record<GuestCheckInLanguage, Record<GuestCheckInServerErrorKey, string>> = {
  it: {
    required: "Compila tutti i campi obbligatori.",
    invalidBirthDate: "Data di nascita non valida.",
    invalidGender: "Sesso non valido.",
    invalidRole: "Ruolo ospite non valido.",
    invalidLink: "Il link non è più valido. Richiedi un nuovo link alla struttura.",
    incomplete: "I dati degli ospiti non sono completi per Alloggiati Web.",
    alreadySent: "La schedina è già stata trasmessa ad Alloggiati Web e i dati non possono più essere modificati.",
    birthCountry: "Paese di nascita non riconosciuto: {value}.",
    citizenship: "Cittadinanza non riconosciuta: {value}.",
    italyBirthPlace: "Per i nati in Italia sono obbligatori comune e provincia di nascita.",
    municipality: "Comune di nascita non riconosciuto: {value}.",
    documentType: "Tipo documento non riconosciuto.",
    documentIssueCountry: "Paese di rilascio del documento non riconosciuto.",
  },
  en: {
    required: "Please complete all required fields.",
    invalidBirthDate: "Invalid date of birth.",
    invalidGender: "Invalid gender.",
    invalidRole: "Invalid guest role.",
    invalidLink: "This link is no longer valid. Please request a new link from the property.",
    incomplete: "The guest details are not complete for registration.",
    alreadySent: "The guest registration has already been submitted and the details can no longer be changed.",
    birthCountry: "Country of birth not recognized: {value}.",
    citizenship: "Citizenship not recognized: {value}.",
    italyBirthPlace: "For guests born in Italy, city and province of birth are required.",
    municipality: "City of birth not recognized: {value}.",
    documentType: "Document type not recognized.",
    documentIssueCountry: "Document country of issue not recognized.",
  },
  es: {
    required: "Completa todos los campos obligatorios.",
    invalidBirthDate: "La fecha de nacimiento no es válida.",
    invalidGender: "El sexo indicado no es válido.",
    invalidRole: "El tipo de huésped no es válido.",
    invalidLink: "Este enlace ya no es válido. Solicita un nuevo enlace al alojamiento.",
    incomplete: "Los datos de los huéspedes no están completos para el registro.",
    alreadySent: "El registro de huéspedes ya ha sido enviado y los datos ya no se pueden modificar.",
    birthCountry: "País de nacimiento no reconocido: {value}.",
    citizenship: "Nacionalidad no reconocida: {value}.",
    italyBirthPlace: "Para los nacidos en Italia son obligatorios el municipio y la provincia de nacimiento.",
    municipality: "Municipio de nacimiento no reconocido: {value}.",
    documentType: "Tipo de documento no reconocido.",
    documentIssueCountry: "País de expedición del documento no reconocido.",
  },
  fr: {
    required: "Veuillez remplir tous les champs obligatoires.",
    invalidBirthDate: "La date de naissance n'est pas valide.",
    invalidGender: "Le sexe indiqué n'est pas valide.",
    invalidRole: "Le rôle du voyageur n'est pas valide.",
    invalidLink: "Ce lien n'est plus valide. Demandez un nouveau lien à l'hébergement.",
    incomplete: "Les informations des voyageurs ne sont pas complètes pour l'enregistrement.",
    alreadySent: "La fiche voyageurs a déjà été transmise et les informations ne peuvent plus être modifiées.",
    birthCountry: "Pays de naissance non reconnu : {value}.",
    citizenship: "Nationalité non reconnue : {value}.",
    italyBirthPlace: "Pour les personnes nées en Italie, la commune et la province de naissance sont obligatoires.",
    municipality: "Commune de naissance non reconnue : {value}.",
    documentType: "Type de document non reconnu.",
    documentIssueCountry: "Pays de délivrance du document non reconnu.",
  },
  pt: {
    required: "Preencha todos os campos obrigatórios.",
    invalidBirthDate: "A data de nascimento não é válida.",
    invalidGender: "O sexo indicado não é válido.",
    invalidRole: "O tipo de hóspede não é válido.",
    invalidLink: "Este link já não é válido. Solicite um novo link ao alojamento.",
    incomplete: "Os dados dos hóspedes não estão completos para o registo.",
    alreadySent: "O registo dos hóspedes já foi enviado e os dados já não podem ser alterados.",
    birthCountry: "País de nascimento não reconhecido: {value}.",
    citizenship: "Nacionalidade não reconhecida: {value}.",
    italyBirthPlace: "Para pessoas nascidas em Itália, o município e a província de nascimento são obrigatórios.",
    municipality: "Município de nascimento não reconhecido: {value}.",
    documentType: "Tipo de documento não reconhecido.",
    documentIssueCountry: "País de emissão do documento não reconhecido.",
  },
};

export function getGuestCheckInLanguage(formData: FormData): GuestCheckInLanguage {
  const value = formData.get("language");
  return typeof value === "string" && isGuestCheckInLanguage(value) ? value : "it";
}

export function guestCheckInServerError(language: GuestCheckInLanguage, key: GuestCheckInServerErrorKey, value?: string) {
  return messages[language][key].replace("{value}", value ?? "");
}
