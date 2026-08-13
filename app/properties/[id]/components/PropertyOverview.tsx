import {
  Bath,
  BedDouble,
  MapPin,
  Users,
} from "lucide-react";

type PropertyOverviewProps = {
  address: string;
  zone: string | null;
  status: string;
  maxGuests: number;
  bedrooms: number | null;
  bathrooms: number | null;
  ownerName: string;
  currentScore: number;
  commercialClass: string;
};

export function PropertyOverview({
  address,
  zone,
  status,
  maxGuests,
  bedrooms,
  bathrooms,
  ownerName,
  currentScore,
  commercialClass,
}: PropertyOverviewProps) {
  const isActive =
    status === "ACTIVE";

  return (
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
                isActive
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                  : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
              ].join(" ")}
            >
              {isActive
                ? "Attivo"
                : formatLabel(status)}
            </span>

            <span className="inline-flex items-center rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
              {formatLabel(
                commercialClass,
              )}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <MapPin
                size={15}
                className="text-slate-400"
              />

              {address}
              {zone
                ? ` · ${zone}`
                : ""}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Users
                size={15}
                className="text-slate-400"
              />

              {maxGuests} ospiti
            </span>

            <span className="inline-flex items-center gap-1.5">
              <BedDouble
                size={15}
                className="text-slate-400"
              />

              {bedrooms ?? "—"}{" "}
              {bedrooms === 1
                ? "camera"
                : "camere"}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Bath
                size={15}
                className="text-slate-400"
              />

              {bathrooms ?? "—"}{" "}
              {bathrooms === 1
                ? "bagno"
                : "bagni"}
            </span>

            <span className="text-slate-400">
              Proprietario:
              <strong className="ml-1 font-semibold text-slate-700">
                {ownerName}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Victory Score
            </p>

            <p className="mt-0.5 text-xs font-medium text-slate-500">
              {formatLabel(
                commercialClass,
              )}
            </p>
          </div>

          <div className="border-l border-slate-200 pl-4">
            <span className="text-2xl font-bold tracking-tight text-blue-600">
              {currentScore}
            </span>

            <span className="ml-1 text-xs text-slate-400">
              /100
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatLabel(
  value: string,
) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}
