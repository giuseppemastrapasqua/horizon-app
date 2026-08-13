"use client";

import { useMemo, useState } from "react";

import {
  getActionStyle,
  getEntityPresentation,
  getEventTitle,
  getTimelineSearchText,
} from "@/lib/audit/timeline-presenter";

type PropertyTimelineItem = {
  id: string;
  action: string;
  entityType: string;
  description: string | null;
  createdAt: Date;
  actor: {
    id: string;
    fullName: string;
    email: string;
  } | null;
};

type PropertyTimelineProps = {
  timeline: PropertyTimelineItem[];
};

type TimelineFilters = {
  search: string;
  action: string;
  entityType: string;
};

const INITIAL_FILTERS: TimelineFilters = {
  search: "",
  action: "ALL",
  entityType: "ALL",
};

function formatEventDate(createdAt: Date) {
  return new Date(createdAt).toLocaleString(
    "it-IT",
  );
}

export function PropertyTimeline({
  timeline,
}: PropertyTimelineProps) {
  const [filters, setFilters] =
    useState<TimelineFilters>(INITIAL_FILTERS);

  const actionOptions = useMemo(
    () =>
      Array.from(
        new Set(
          timeline.map((event) => event.action),
        ),
      ).sort((firstAction, secondAction) =>
        getActionStyle(firstAction).badge.localeCompare(
          getActionStyle(secondAction).badge,
          "it",
        ),
      ),
    [timeline],
  );

  const entityTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          timeline.map(
            (event) => event.entityType,
          ),
        ),
      ).sort((firstEntity, secondEntity) =>
        getEntityPresentation(
          firstEntity,
        ).label.localeCompare(
          getEntityPresentation(secondEntity)
            .label,
          "it",
        ),
      ),
    [timeline],
  );

  const filteredTimeline = useMemo(() => {
    const normalizedSearch =
      filters.search.trim().toLowerCase();

    return timeline.filter((event) => {
      const matchesAction =
        filters.action === "ALL" ||
        event.action === filters.action;

      const matchesEntityType =
        filters.entityType === "ALL" ||
        event.entityType ===
          filters.entityType;

      const searchableText = [
        getTimelineSearchText(event),
        event.actor?.fullName,
        event.actor?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(
          normalizedSearch,
        );

      return (
        matchesAction &&
        matchesEntityType &&
        matchesSearch
      );
    });
  }, [filters, timeline]);

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.action !== "ALL" ||
    filters.entityType !== "ALL";

  function resetFilters() {
    setFilters(INITIAL_FILTERS);
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">
          Timeline immobile
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          Storico delle attività registrate per
          questo immobile.
        </p>
      </div>

      {timeline.length === 0 ? (
        <p className="text-sm text-slate-500">
          Nessun evento registrato.
        </p>
      ) : (
        <>
          <div className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cerca
              </span>

              <input
                type="search"
                value={filters.search}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    search: event.target.value,
                  }));
                }}
                placeholder="Descrizione, utente o entità"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Azione
              </span>

              <select
                value={filters.action}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    action: event.target.value,
                  }));
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">
                  Tutte le azioni
                </option>

                {actionOptions.map((action) => (
                  <option
                    key={action}
                    value={action}
                  >
                    {
                      getActionStyle(action)
                        .badge
                    }
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Entità
              </span>

              <select
                value={filters.entityType}
                onChange={(event) => {
                  setFilters((current) => ({
                    ...current,
                    entityType:
                      event.target.value,
                  }));
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="ALL">
                  Tutte le entità
                </option>

                {entityTypeOptions.map(
                  (entityType) => {
                    const entity =
                      getEntityPresentation(
                        entityType,
                      );

                    return (
                      <option
                        key={entityType}
                        value={entityType}
                      >
                        {entity.icon}{" "}
                        {entity.label}
                      </option>
                    );
                  },
                )}
              </select>
            </label>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {filteredTimeline.length}{" "}
              {filteredTimeline.length === 1
                ? "evento"
                : "eventi"}
              {hasActiveFilters
                ? ` su ${timeline.length}`
                : ""}
            </p>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Azzera filtri
              </button>
            ) : null}
          </div>

          {filteredTimeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center">
              <p className="font-medium text-slate-700">
                Nessun evento corrisponde ai
                filtri selezionati.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 text-sm font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900"
              >
                Mostra tutti gli eventi
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTimeline.map((event) => {
                const action =
                  getActionStyle(event.action);

                const entity =
                  getEntityPresentation(
                    event.entityType,
                  );

                return (
                  <article
                    key={event.id}
                    className="rounded-2xl border border-slate-200 p-4 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                      <div className="flex min-w-0 gap-4">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl"
                          aria-hidden="true"
                        >
                          {entity.icon}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {getEventTitle(
                                event,
                              )}
                            </p>

                            <span
                              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${action.badgeClass}`}
                            >
                              {action.badge}
                            </span>
                          </div>

                          <p className="mt-2 text-sm text-slate-500">
                            {event.actor
                              ?.fullName ??
                              "Sistema"}
                          </p>

                          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                            {entity.label}
                          </p>
                        </div>
                      </div>

                      <time
                        dateTime={new Date(
                          event.createdAt,
                        ).toISOString()}
                        className="whitespace-nowrap text-xs text-slate-500"
                      >
                        {formatEventDate(
                          event.createdAt,
                        )}
                      </time>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}