import Link from "next/link";

import {
  Activity,
} from "lucide-react";

import {
  StatusBadge,
} from "@/components/ui/StatusBadge";

import type {
  UiTone,
} from "@/components/ui/tokens";

export type PropertyTimelineItem = {
  id: string;
  title: string;
  description: string;
  occurredAt: Date;
  category:
    | "BOOKING"
    | "TASK"
    | "DOCUMENT"
    | "SYSTEM";
  href?: string;
  status?:
    | "SUCCESS"
    | "WARNING"
    | "DANGER"
    | "INFO";
};

type PropertyTimelineProps = {
  items: PropertyTimelineItem[];
};

export function PropertyTimeline({
  items,
}: PropertyTimelineProps) {
  return (
    <section className="h-full rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Activity size={14} />
            </span>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">
                Timeline
              </p>

              <h2 className="mt-0.5 text-base font-bold tracking-tight text-slate-900">
                Attività recenti
              </h2>
            </div>
          </div>

          <p className="mt-2 text-[10px] text-slate-500">
            Ultimi eventi operativi dell&apos;immobile.
          </p>
        </div>

        <StatusBadge
          label={`${items.length} eventi`}
          tone="default"
          compact
        />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-5 text-center">
          <p className="text-xs font-semibold text-slate-700">
            Nessuna attività recente
          </p>
        </div>
      ) : (
        <div>
          {items.map(
            (
              item,
              index,
            ) => (
              <div
                key={item.id}
                className="grid grid-cols-[18px_minmax(0,1fr)] gap-3"
              >
                <div className="flex flex-col items-center">
                  <span
                    className={[
                      "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4",
                      getStatusClasses(
                        item.status ??
                          "INFO",
                      ),
                    ].join(" ")}
                  />

                  {index <
                  items.length - 1 ? (
                    <span className="mt-1 min-h-12 w-px flex-1 bg-slate-200" />
                  ) : null}
                </div>

                <div className="pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="text-[10px] font-bold text-slate-900 transition hover:text-blue-700"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <p className="text-[10px] font-bold text-slate-900">
                          {item.title}
                        </p>
                      )}

                      <p className="mt-1 text-[9px] leading-4 text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <StatusBadge
                      label={item.category}
                      tone={getCategoryTone(
                        item.category,
                      )}
                      compact
                    />
                  </div>

                  <p className="mt-1.5 text-[8px] font-medium text-slate-400">
                    {item.occurredAt.toLocaleString(
                      "it-IT",
                    )}
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}

function getCategoryTone(
  category:
    PropertyTimelineItem["category"],
): UiTone {
  if (category === "BOOKING") {
    return "blue";
  }

  if (category === "TASK") {
    return "yellow";
  }

  if (category === "DOCUMENT") {
    return "blue";
  }

  return "default";
}

function getStatusClasses(
  status:
    NonNullable<
      PropertyTimelineItem["status"]
    >,
) {
  if (status === "SUCCESS") {
    return "bg-emerald-500 ring-emerald-50";
  }

  if (status === "WARNING") {
    return "bg-amber-500 ring-amber-50";
  }

  if (status === "DANGER") {
    return "bg-rose-500 ring-rose-50";
  }

  return "bg-blue-500 ring-blue-50";
}

