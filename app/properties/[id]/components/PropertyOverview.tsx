import {
  Bath,
  BedDouble,
  Building2,
  Crown,
  MapPin,
  ShieldCheck,
  UserRound,
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
    <section className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-1 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400" />

      <div className="px-5 py-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    isActive
                      ? "bg-emerald-500"
                      : "bg-slate-400",
                  ].join(" ")}
                />

                {isActive
                  ? "Attivo"
                  : formatLabel(status)}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">
                <Building2 size={11} />

                {formatLabel(
                  commercialClass,
                )}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-2 gap-y-2">
              <InfoItem
                icon={<MapPin size={14} />}
                wide
              >
                {address}
                {zone
                  ? ` · ${zone}`
                  : ""}
              </InfoItem>

              <InfoItem
                icon={<Users size={14} />}
              >
                {maxGuests} ospiti
              </InfoItem>

              <InfoItem
                icon={<BedDouble size={14} />}
              >
                {bedrooms ?? "—"}{" "}
                {bedrooms === 1
                  ? "camera"
                  : "camere"}
              </InfoItem>

              <InfoItem
                icon={<Bath size={14} />}
              >
                {bathrooms ?? "—"}{" "}
                {bathrooms === 1
                  ? "bagno"
                  : "bagni"}
              </InfoItem>

              <InfoItem
                icon={<UserRound size={14} />}
              >
                <span className="text-slate-400">
                  Proprietario
                </span>

                <strong className="font-semibold text-slate-700">
                  {ownerName}
                </strong>
              </InfoItem>
            </div>
          </div>

          <div className="relative shrink-0 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-sky-50 px-5 py-4 xl:min-w-[245px]">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-100/60 blur-2xl" />

            <div className="relative flex items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <Crown size={15} />
                  </span>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-700">
                      Victory Score
                    </p>

                    <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                      Performance immobile
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  <ShieldCheck
                    size={13}
                    className="text-emerald-500"
                  />

                  <span className="text-[10px] font-medium text-slate-500">
                    {formatLabel(
                      commercialClass,
                    )}
                  </span>
                </div>
              </div>

              <div className="border-l border-blue-100 pl-5 text-right">
                <div className="flex items-baseline justify-end">
                  <span className="text-3xl font-bold tracking-[-0.04em] text-blue-600">
                    {currentScore}
                  </span>

                  <span className="ml-1 text-[10px] font-semibold text-slate-400">
                    /100
                  </span>
                </div>

                <p className="mt-1 text-[9px] font-medium text-slate-400">
                  Horizon Index
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoItem({
  icon,
  children,
  wide = false,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={[
        "inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-xs text-slate-600",
        wide
          ? "sm:max-w-md"
          : "",
      ].join(" ")}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white text-blue-500 shadow-sm ring-1 ring-slate-100">
        {icon}
      </span>

      <span className="flex min-w-0 items-center gap-1.5">
        {children}
      </span>
    </div>
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
