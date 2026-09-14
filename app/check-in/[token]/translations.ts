export const guestCheckInLanguages = ["it", "en", "es", "fr", "pt"] as const;

export type GuestCheckInLanguage = (typeof guestCheckInLanguages)[number];

export function isGuestCheckInLanguage(value: string): value is GuestCheckInLanguage {
  return guestCheckInLanguages.includes(value as GuestCheckInLanguage);
}

export const guestCheckInLanguageLabels: Record<GuestCheckInLanguage, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
  fr: "Français",
  pt: "Português",
};

export const guestCheckInTranslations = {
  it: {
    title: "Dati ospiti per il soggiorno",
    intro: "Inserisci i dati degli ospiti necessari alla registrazione del soggiorno.",
    booking: "Prenotazione", checkIn: "Check-in", checkOut: "Check-out", guestCount: "Numero ospiti",
    language: "Lingua", stayType: "Tipo soggiorno", family: "Famiglia", group: "Gruppo",
    guest: "Ospite", leader: "intestatario", firstName: "Nome", lastName: "Cognome", gender: "Sesso",
    select: "Seleziona", male: "Maschio", female: "Femmina", birthDate: "Data di nascita",
    birthCountry: "Paese di nascita", citizenship: "Cittadinanza",
    birthCity: "Comune di nascita (se nato in Italia)", birthProvince: "Provincia di nascita (sigla)",
    document: "Documento", documentType: "Tipo documento", documentNumber: "Numero documento",
    documentIssueCountry: "Paese di rilascio", documentIssueCity: "Comune/località di rilascio",
    saving: "Salvataggio...", save: "Salva dati ospiti", saved: "Dati ospiti salvati",
    savedText: "La schedina è stata compilata correttamente. Puoi chiudere questa pagina.",
    genericError: "Salvataggio non riuscito.",
  },
  en: {
    title: "Guest details for your stay",
    intro: "Enter the guest details required to register your stay.",
    booking: "Booking", checkIn: "Check-in", checkOut: "Check-out", guestCount: "Number of guests",
    language: "Language", stayType: "Stay type", family: "Family", group: "Group",
    guest: "Guest", leader: "lead guest", firstName: "First name", lastName: "Last name", gender: "Gender",
    select: "Select", male: "Male", female: "Female", birthDate: "Date of birth",
    birthCountry: "Country of birth", citizenship: "Citizenship",
    birthCity: "City of birth (if born in Italy)", birthProvince: "Province of birth (code)",
    document: "Identity document", documentType: "Document type", documentNumber: "Document number",
    documentIssueCountry: "Country of issue", documentIssueCity: "City/place of issue",
    saving: "Saving...", save: "Save guest details", saved: "Guest details saved",
    savedText: "The guest registration form has been completed successfully. You can close this page.",
    genericError: "Unable to save the guest details.",
  },
  es: {
    title: "Datos de los huéspedes para la estancia",
    intro: "Introduce los datos de los huéspedes necesarios para registrar la estancia.",
    booking: "Reserva", checkIn: "Check-in", checkOut: "Check-out", guestCount: "Número de huéspedes",
    language: "Idioma", stayType: "Tipo de estancia", family: "Familia", group: "Grupo",
    guest: "Huésped", leader: "titular", firstName: "Nombre", lastName: "Apellidos", gender: "Sexo",
    select: "Selecciona", male: "Masculino", female: "Femenino", birthDate: "Fecha de nacimiento",
    birthCountry: "País de nacimiento", citizenship: "Nacionalidad",
    birthCity: "Municipio de nacimiento (si nació en Italia)", birthProvince: "Provincia de nacimiento (sigla)",
    document: "Documento de identidad", documentType: "Tipo de documento", documentNumber: "Número de documento",
    documentIssueCountry: "País de expedición", documentIssueCity: "Municipio/localidad de expedición",
    saving: "Guardando...", save: "Guardar datos de huéspedes", saved: "Datos de huéspedes guardados",
    savedText: "El formulario de registro se ha completado correctamente. Puedes cerrar esta página.",
    genericError: "No se han podido guardar los datos.",
  },
  fr: {
    title: "Informations des voyageurs pour le séjour",
    intro: "Saisissez les informations des voyageurs nécessaires à l'enregistrement du séjour.",
    booking: "Réservation", checkIn: "Arrivée", checkOut: "Départ", guestCount: "Nombre de voyageurs",
    language: "Langue", stayType: "Type de séjour", family: "Famille", group: "Groupe",
    guest: "Voyageur", leader: "titulaire", firstName: "Prénom", lastName: "Nom", gender: "Sexe",
    select: "Sélectionner", male: "Homme", female: "Femme", birthDate: "Date de naissance",
    birthCountry: "Pays de naissance", citizenship: "Nationalité",
    birthCity: "Commune de naissance (si né en Italie)", birthProvince: "Province de naissance (sigle)",
    document: "Pièce d'identité", documentType: "Type de document", documentNumber: "Numéro du document",
    documentIssueCountry: "Pays de délivrance", documentIssueCity: "Commune/lieu de délivrance",
    saving: "Enregistrement...", save: "Enregistrer les informations", saved: "Informations enregistrées",
    savedText: "Le formulaire d'enregistrement a été complété avec succès. Vous pouvez fermer cette page.",
    genericError: "Impossible d'enregistrer les informations.",
  },
  pt: {
    title: "Dados dos hóspedes para a estadia",
    intro: "Introduza os dados dos hóspedes necessários para registar a estadia.",
    booking: "Reserva", checkIn: "Check-in", checkOut: "Check-out", guestCount: "Número de hóspedes",
    language: "Idioma", stayType: "Tipo de estadia", family: "Família", group: "Grupo",
    guest: "Hóspede", leader: "titular", firstName: "Nome", lastName: "Apelido", gender: "Sexo",
    select: "Selecionar", male: "Masculino", female: "Feminino", birthDate: "Data de nascimento",
    birthCountry: "País de nascimento", citizenship: "Nacionalidade",
    birthCity: "Município de nascimento (se nasceu em Itália)", birthProvince: "Província de nascimento (sigla)",
    document: "Documento de identificação", documentType: "Tipo de documento", documentNumber: "Número do documento",
    documentIssueCountry: "País de emissão", documentIssueCity: "Município/local de emissão",
    saving: "A guardar...", save: "Guardar dados dos hóspedes", saved: "Dados dos hóspedes guardados",
    savedText: "O formulário de registo foi preenchido corretamente. Pode fechar esta página.",
    genericError: "Não foi possível guardar os dados.",
  },
} as const;
