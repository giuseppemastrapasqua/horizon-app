export const PROPERTY_HOUSE_RULE_CATEGORIES = [
  {
    key: "check-in-out",
    label: "Check-in e check-out",
    sortOrder: 10,
  },
  {
    key: "guests",
    label: "Ospiti",
    sortOrder: 20,
  },
  {
    key: "behavior",
    label: "Comportamento",
    sortOrder: 30,
  },
  {
    key: "children",
    label: "Bambini",
    sortOrder: 40,
  },
  {
    key: "pets",
    label: "Animali",
    sortOrder: 50,
  },
  {
    key: "safety",
    label: "Sicurezza",
    sortOrder: 60,
  },
] as const;

export type PropertyHouseRuleCategory =
  (typeof PROPERTY_HOUSE_RULE_CATEGORIES)[number]["key"];

export const PROPERTY_HOUSE_RULE_CATEGORY_LABELS: Record<
  PropertyHouseRuleCategory,
  string
> = Object.fromEntries(
  PROPERTY_HOUSE_RULE_CATEGORIES.map((category) => [
    category.key,
    category.label,
  ]),
) as Record<PropertyHouseRuleCategory, string>;

export type PropertyHouseRuleDefinition = {
  key: string;
  label: string;
  category: PropertyHouseRuleCategory;
  description: string;
  sortOrder: number;
};

export const PROPERTY_HOUSE_RULES: PropertyHouseRuleDefinition[] = [
  {
    key: "check-in-from-15",
    label: "Check-in dalle 15:00",
    category: "check-in-out",
    description:
      "Gli ospiti possono effettuare il check-in a partire dalle ore 15:00.",
    sortOrder: 10,
  },
  {
    key: "check-in-until-22",
    label: "Check-in entro le 22:00",
    category: "check-in-out",
    description:
      "Il check-in deve essere completato entro le ore 22:00.",
    sortOrder: 20,
  },
  {
    key: "self-check-in",
    label: "Self check-in disponibile",
    category: "check-in-out",
    description:
      "L'accesso all'immobile può essere effettuato autonomamente dagli ospiti.",
    sortOrder: 30,
  },
  {
    key: "check-out-by-10",
    label: "Check-out entro le 10:00",
    category: "check-in-out",
    description:
      "Gli ospiti devono lasciare l'immobile entro le ore 10:00.",
    sortOrder: 40,
  },
  {
    key: "registered-guests-only",
    label: "Solo ospiti registrati",
    category: "guests",
    description:
      "L'accesso è consentito esclusivamente agli ospiti indicati nella prenotazione.",
    sortOrder: 10,
  },
  {
    key: "no-unregistered-visitors",
    label: "Visitatori esterni non ammessi",
    category: "guests",
    description:
      "Non è consentito introdurre nell'immobile persone non registrate.",
    sortOrder: 20,
  },
  {
    key: "respect-maximum-occupancy",
    label: "Rispettare la capienza massima",
    category: "guests",
    description:
      "Il numero degli occupanti non può superare la capienza massima dell'immobile.",
    sortOrder: 30,
  },
  {
    key: "no-parties",
    label: "Feste ed eventi non ammessi",
    category: "behavior",
    description:
      "Non è consentito organizzare feste, ricevimenti o eventi all'interno dell'immobile.",
    sortOrder: 10,
  },
  {
    key: "no-smoking",
    label: "Vietato fumare",
    category: "behavior",
    description:
      "È vietato fumare all'interno dell'immobile.",
    sortOrder: 20,
  },
  {
    key: "quiet-hours-22-08",
    label: "Silenzio dalle 22:00 alle 08:00",
    category: "behavior",
    description:
      "Durante le ore notturne è richiesto di limitare rumori e disturbi.",
    sortOrder: 30,
  },
  {
    key: "respect-neighbors",
    label: "Rispettare il vicinato",
    category: "behavior",
    description:
      "Gli ospiti devono mantenere un comportamento rispettoso verso condomini e vicini.",
    sortOrder: 40,
  },
  {
    key: "no-commercial-activities",
    label: "Attività commerciali non ammesse",
    category: "behavior",
    description:
      "L'immobile non può essere utilizzato per attività commerciali, riprese o servizi professionali non autorizzati.",
    sortOrder: 50,
  },
  {
    key: "children-welcome",
    label: "Bambini ammessi",
    category: "children",
    description:
      "L'immobile è adatto e disponibile anche per soggiorni con bambini.",
    sortOrder: 10,
  },
  {
    key: "children-with-supervision",
    label: "Bambini sotto supervisione",
    category: "children",
    description:
      "I bambini devono essere sempre sorvegliati da un adulto.",
    sortOrder: 20,
  },
  {
    key: "not-suitable-for-infants",
    label: "Non adatto ai neonati",
    category: "children",
    description:
      "L'immobile potrebbe non essere adatto a neonati o bambini molto piccoli.",
    sortOrder: 30,
  },
  {
    key: "pets-allowed",
    label: "Animali ammessi",
    category: "pets",
    description:
      "Gli ospiti possono soggiornare con animali domestici.",
    sortOrder: 10,
  },
  {
    key: "pets-on-request",
    label: "Animali ammessi su richiesta",
    category: "pets",
    description:
      "La presenza di animali domestici deve essere autorizzata prima del soggiorno.",
    sortOrder: 20,
  },
  {
    key: "pets-not-allowed",
    label: "Animali non ammessi",
    category: "pets",
    description:
      "Non è consentito introdurre animali domestici nell'immobile.",
    sortOrder: 30,
  },
  {
    key: "do-not-tamper-safety-devices",
    label: "Non manomettere i dispositivi di sicurezza",
    category: "safety",
    description:
      "È vietato rimuovere, disattivare o manomettere rilevatori e dispositivi di sicurezza.",
    sortOrder: 10,
  },
  {
    key: "lock-doors-and-windows",
    label: "Chiudere porte e finestre",
    category: "safety",
    description:
      "Quando si lascia l'immobile è necessario chiudere correttamente porte e finestre.",
    sortOrder: 20,
  },
  {
    key: "report-damage-immediately",
    label: "Segnalare immediatamente eventuali danni",
    category: "safety",
    description:
      "Danni, guasti o problemi di sicurezza devono essere comunicati tempestivamente.",
    sortOrder: 30,
  },
  {
    key: "no-open-flames",
    label: "Fiamme libere non ammesse",
    category: "safety",
    description:
      "Non è consentito utilizzare candele, fornelli portatili o altre fiamme libere non autorizzate.",
    sortOrder: 40,
  },
];

export function isPropertyHouseRuleCategory(
  value: string,
): value is PropertyHouseRuleCategory {
  return PROPERTY_HOUSE_RULE_CATEGORIES.some(
    (category) => category.key === value,
  );
}