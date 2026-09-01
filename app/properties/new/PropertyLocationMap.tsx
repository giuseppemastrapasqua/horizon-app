"use client";

import dynamic from "next/dynamic";

const PropertyLocationMapClient = dynamic(
  () => import("./PropertyLocationMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
        Caricamento mappa...
      </div>
    ),
  },
);

export function PropertyLocationMap() {
  return <PropertyLocationMapClient />;
}