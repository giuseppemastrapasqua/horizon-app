import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} from "./constants";

export type TimelineActionStyle = {
  badge: string;
  badgeClass: string;
};

export type TimelineEntityPresentation = {
  icon: string;
  label: string;
};

type TimelineEventPresentationInput = {
  action: string;
  entityType: string;
  description?: string | null;
};

const ACTION_STYLES: Record<
  string,
  TimelineActionStyle
> = {
  [AUDIT_ACTIONS.CREATE]: {
    badge: "Creato",
    badgeClass:
      "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  [AUDIT_ACTIONS.UPDATE]: {
    badge: "Aggiornato",
    badgeClass:
      "bg-amber-100 text-amber-700 border-amber-200",
  },
  [AUDIT_ACTIONS.DELETE]: {
    badge: "Eliminato",
    badgeClass:
      "bg-red-100 text-red-700 border-red-200",
  },
  [AUDIT_ACTIONS.RETRY]: {
    badge: "Nuovo tentativo",
    badgeClass:
      "bg-orange-100 text-orange-700 border-orange-200",
  },
  [AUDIT_ACTIONS.COMPLETE]: {
    badge: "Completato",
    badgeClass:
      "bg-sky-100 text-sky-700 border-sky-200",
  },
  [AUDIT_ACTIONS.FAIL]: {
    badge: "Errore",
    badgeClass:
      "bg-slate-200 text-slate-700 border-slate-300",
  },
};

const ENTITY_PRESENTATIONS: Record<
  string,
  TimelineEntityPresentation
> = {
  [AUDIT_ENTITY_TYPES.PROPERTY]: {
    icon: "🏠",
    label: "Immobile",
  },
  [AUDIT_ENTITY_TYPES.PROPERTY_DOCUMENT]: {
    icon: "📄",
    label: "Documento immobile",
  },
  [AUDIT_ENTITY_TYPES.PROPERTY_PHOTO]: {
    icon: "🖼️",
    label: "Foto immobile",
  },
  [AUDIT_ENTITY_TYPES.PROPERTY_AMENITY]: {
    icon: "✨",
    label: "Servizio immobile",
  },
  [AUDIT_ENTITY_TYPES.AMENITY]: {
    icon: "✨",
    label: "Servizio",
  },
  [AUDIT_ENTITY_TYPES.HOUSE_RULE]: {
    icon: "📋",
    label: "Regola della casa",
  },
  [AUDIT_ENTITY_TYPES.CHECKIN_CONFIGURATION]: {
    icon: "🔑",
    label: "Configurazione check-in",
  },
  [AUDIT_ENTITY_TYPES.BOOKING]: {
    icon: "📅",
    label: "Prenotazione",
  },
  [AUDIT_ENTITY_TYPES.GUEST]: {
    icon: "👤",
    label: "Ospite",
  },
  [AUDIT_ENTITY_TYPES.OWNER]: {
    icon: "🤝",
    label: "Proprietario",
  },
  [AUDIT_ENTITY_TYPES.TASK]: {
    icon: "✅",
    label: "Attività",
  },
  [AUDIT_ENTITY_TYPES.CLEANING_TASK]: {
    icon: "🧹",
    label: "Attività di pulizia",
  },
  [AUDIT_ENTITY_TYPES.CHECKOUT_TASK]: {
    icon: "🚪",
    label: "Attività di check-out",
  },
  [AUDIT_ENTITY_TYPES.DOCUMENT_TASK]: {
    icon: "📑",
    label: "Attività documentale",
  },
  [AUDIT_ENTITY_TYPES.OPERATIONAL_TASK]: {
    icon: "⚙️",
    label: "Attività operativa",
  },
  [AUDIT_ENTITY_TYPES.FINANCE_FORMULA]: {
    icon: "🧮",
    label: "Formula finanziaria",
  },
  [AUDIT_ENTITY_TYPES.FINANCE_REPORT]: {
    icon: "📊",
    label: "Report finanziario",
  },
  [AUDIT_ENTITY_TYPES.OCR]: {
    icon: "🔎",
    label: "Elaborazione documento",
  },
};

export function getActionStyle(
  action: string,
): TimelineActionStyle {
  return (
    ACTION_STYLES[action] ?? {
      badge: formatTechnicalValue(action),
      badgeClass:
        "bg-slate-100 text-slate-700 border-slate-200",
    }
  );
}

export function getEntityPresentation(
  entityType: string,
): TimelineEntityPresentation {
  return (
    ENTITY_PRESENTATIONS[entityType] ?? {
      icon: "📌",
      label: formatTechnicalValue(entityType),
    }
  );
}

export function getEventTitle({
  action,
  entityType,
  description,
}: TimelineEventPresentationInput) {
  const normalizedDescription =
    description?.trim();

  if (normalizedDescription) {
    return normalizedDescription;
  }

  const actionLabel = getActionStyle(action).badge;
  const entityLabel =
    getEntityPresentation(entityType).label;

  return `${entityLabel}: ${actionLabel.toLowerCase()}`;
}

export function getTimelineSearchText({
  action,
  entityType,
  description,
}: TimelineEventPresentationInput) {
  const actionStyle = getActionStyle(action);
  const entityPresentation =
    getEntityPresentation(entityType);

  return [
    description,
    action,
    actionStyle.badge,
    entityType,
    entityPresentation.label,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatTechnicalValue(value: string) {
  return value
    .replaceAll("_", " ")
    .trim()
    .toLowerCase()
    .replace(/^\p{L}/u, (character) =>
      character.toUpperCase(),
    );
}