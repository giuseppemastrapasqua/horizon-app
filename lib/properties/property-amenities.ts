export const PROPERTY_AMENITY_CATEGORIES = [
  "internet",
  "comfort",
  "kitchen",
  "laundry",
  "entertainment",
  "outdoor",
  "access",
  "family",
  "rules",
] as const;

export type PropertyAmenityCategory =
  (typeof PROPERTY_AMENITY_CATEGORIES)[number];

export type PropertyAmenityDefinition = {
  key: string;
  label: string;
  category: PropertyAmenityCategory;
};

export const PROPERTY_AMENITIES = [
  {
    key: "wifi",
    label: "Wi-Fi",
    category: "internet",
  },

  {
    key: "air-conditioning",
    label: "Aria condizionata",
    category: "comfort",
  },
  {
    key: "heating",
    label: "Riscaldamento",
    category: "comfort",
  },
  {
    key: "fans",
    label: "Ventilatori",
    category: "comfort",
  },

  {
    key: "equipped-kitchen",
    label: "Cucina attrezzata",
    category: "kitchen",
  },
  {
    key: "dishwasher",
    label: "Lavastoviglie",
    category: "kitchen",
  },
  {
    key: "microwave",
    label: "Microonde",
    category: "kitchen",
  },
  {
    key: "coffee-machine",
    label: "Macchina del caffè",
    category: "kitchen",
  },
  {
    key: "kettle",
    label: "Bollitore",
    category: "kitchen",
  },
  {
    key: "toaster",
    label: "Tostapane",
    category: "kitchen",
  },

  {
    key: "washing-machine",
    label: "Lavatrice",
    category: "laundry",
  },
  {
    key: "dryer",
    label: "Asciugatrice",
    category: "laundry",
  },
  {
    key: "iron",
    label: "Ferro da stiro",
    category: "laundry",
  },

  {
    key: "tv",
    label: "TV",
    category: "entertainment",
  },
  {
    key: "smart-tv",
    label: "Smart TV",
    category: "entertainment",
  },
  {
    key: "netflix",
    label: "Netflix",
    category: "entertainment",
  },

  {
    key: "balcony",
    label: "Balcone",
    category: "outdoor",
  },
  {
    key: "terrace",
    label: "Terrazza",
    category: "outdoor",
  },
  {
    key: "garden",
    label: "Giardino",
    category: "outdoor",
  },
  {
    key: "pool",
    label: "Piscina",
    category: "outdoor",
  },
  {
    key: "hot-tub",
    label: "Jacuzzi",
    category: "outdoor",
  },
  {
    key: "barbecue",
    label: "Barbecue",
    category: "outdoor",
  },

  {
    key: "elevator",
    label: "Ascensore",
    category: "access",
  },
  {
    key: "parking",
    label: "Parcheggio",
    category: "access",
  },
  {
    key: "self-check-in",
    label: "Self check-in",
    category: "access",
  },

  {
    key: "crib",
    label: "Culla",
    category: "family",
  },
  {
    key: "high-chair",
    label: "Seggiolone",
    category: "family",
  },

  {
    key: "pets-allowed",
    label: "Animali ammessi",
    category: "rules",
  },
  {
    key: "no-smoking",
    label: "Vietato fumare",
    category: "rules",
  },
] as const satisfies readonly PropertyAmenityDefinition[];

export const PROPERTY_AMENITY_CATEGORY_LABELS: Record<
  PropertyAmenityCategory,
  string
> = {
  internet: "Internet",
  comfort: "Comfort",
  kitchen: "Cucina",
  laundry: "Lavanderia",
  entertainment: "Intrattenimento",
  outdoor: "Spazi esterni",
  access: "Accesso",
  family: "Famiglia",
  rules: "Regole",
};