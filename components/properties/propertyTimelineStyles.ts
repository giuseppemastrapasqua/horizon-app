export function getActionStyle(action: string) {
  switch (action) {
    case "CREATE":
      return {
        icon: "🟢",
        badge: "Creato",
        badgeClass:
          "bg-emerald-100 text-emerald-700 border-emerald-200",
      };

    case "UPDATE":
      return {
        icon: "🟡",
        badge: "Aggiornato",
        badgeClass:
          "bg-amber-100 text-amber-700 border-amber-200",
      };

    case "DELETE":
      return {
        icon: "🔴",
        badge: "Eliminato",
        badgeClass:
          "bg-red-100 text-red-700 border-red-200",
      };

    case "RETRY":
      return {
        icon: "🟠",
        badge: "Retry",
        badgeClass:
          "bg-orange-100 text-orange-700 border-orange-200",
      };

    case "COMPLETE":
      return {
        icon: "🔵",
        badge: "Completato",
        badgeClass:
          "bg-sky-100 text-sky-700 border-sky-200",
      };

    case "FAIL":
      return {
        icon: "⚫",
        badge: "Errore",
        badgeClass:
          "bg-slate-200 text-slate-700 border-slate-300",
      };

    default:
      return {
        icon: "📌",
        badge: action,
        badgeClass:
          "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

export function getEntityLabel(entityType: string) {
  switch (entityType) {
    case "PROPERTY":
      return "Immobile";

    case "PROPERTY_DOCUMENT":
      return "Documento";

    case "PROPERTY_CODES":
      return "Codici CIN/CIR";

    default:
      return entityType
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
  }
}