import Link from "next/link";

import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  FileText,
  ReceiptText,
  UserRound,
} from "lucide-react";

type PropertyQuickActionsProps = {
  propertyId: string;
  ownerId: string;
};

export function PropertyQuickActions({
  propertyId,
  ownerId,
}: PropertyQuickActionsProps) {
  const actions = [
    {
      title:
        "Nuova prenotazione",
      description:
        "Registra un nuovo soggiorno.",
      href:
        `/bookings/new?propertyId=${propertyId}`,
      icon:
        CalendarPlus,
      primary:
        true,
    },
    {
      title:
        "Nuovo task",
      description:
        "Crea una pulizia, manutenzione o attività.",
      href:
        `/tasks/new?propertyId=${propertyId}`,
      icon:
        ClipboardList,
    },
    {
      title:
        "Calendario immobile",
      description:
        "Visualizza soggiorni e tariffe.",
      href:
        `/calendar?propertyId=${propertyId}`,
      icon:
        CalendarDays,
    },
    {
      title:
        "Rendiconto immobile",
      description:
        "Apri il rendiconto mensile.",
      href:
        `/reports/monthly/property?propertyId=${propertyId}`,
      icon:
        ReceiptText,
    },
    {
      title:
        "Documenti",
      description:
        "Consulta report e documenti.",
      href:
        `/documents?propertyId=${propertyId}`,
      icon:
        FileText,
    },
    {
      title:
        "Owner workspace",
      description:
        "Apri la console del proprietario.",
      href:
        `/owners/${ownerId}`,
      icon:
        UserRound,
    },
  ];

  return (
    <section className="h-full rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">
          Workspace
        </p>

        <h2 className="mt-1 text-base font-bold tracking-tight text-slate-900">
          Azioni rapide
        </h2>

        <p className="mt-1 text-[10px] text-slate-500">
          Accessi diretti alle operazioni più frequenti.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {actions.map(
          (action) => {
            const Icon =
              action.icon;

            return (
              <Link
                key={action.title}
                href={action.href}
                className={[
                  "group rounded-xl border p-3 transition",
                  action.primary
                    ? "border-blue-200 bg-blue-50/80 hover:border-blue-300 hover:bg-blue-100/60"
                    : "border-slate-200 bg-slate-50/45 hover:border-blue-200 hover:bg-blue-50/40",
                ].join(" ")}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={[
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white transition group-hover:-translate-y-px",
                      action.primary
                        ? "border-blue-200 text-blue-600"
                        : "border-slate-200 text-blue-500",
                    ].join(" ")}
                  >
                    <Icon size={15} />
                  </span>

                  <div className="min-w-0">
                    <p
                      className={[
                        "text-[10px] font-bold",
                        action.primary
                          ? "text-blue-700"
                          : "text-slate-900",
                      ].join(" ")}
                    >
                      {action.title}
                    </p>

                    <p className="mt-1 text-[8px] leading-3.5 text-slate-500">
                      {action.description}
                    </p>

                    <span className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold text-blue-600">
                      Apri

                      <ArrowRight
                        size={10}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </div>
              </Link>
            );
          },
        )}
      </div>
    </section>
  );
}
