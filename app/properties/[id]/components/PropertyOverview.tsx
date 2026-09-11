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
  const isActive = status === "ACTIVE";

  return (
    <section className="mb-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#09131C]/95 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="h-px bg-gradient-to-r from-[#D8B367] via-[#C89A49] to-transparent" />

      <div className="px-5 py-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset",
                  isActive
                    ? "bg-emerald-400/[0.07] text-emerald-300 ring-emerald-400/20"
                    : "bg-white/[0.04] text-[#A4AFB8] ring-white/[0.08]",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    isActive
                      ? "bg-emerald-400"
                      : "bg-[#6F7E8A]",
                  ].join(" ")}
                />

                {formatPropertyStatus(status)}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D8B367]/[0.07] px-2.5 py-1 text-[10px] font-semibold text-[#D8B367] ring-1 ring-inset ring-[#D8B367]/20">
                <Building2 size={11} />
                {formatLabel(commercialClass)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-2 gap-y-2">
              <InfoItem
                icon={<MapPin size={14} />}
                wide
              >
                {address}
                {zone ? ` · ${zone}` : ""}
              </InfoItem>

              <InfoItem icon={<Users size={14} />}>
                {maxGuests} ospiti
              </InfoItem>

              <InfoItem icon={<BedDouble size={14} />}>
                {bedrooms ?? "—"}{" "}
                {bedrooms === 1 ? "camera" : "camere"}
              </InfoItem>

              <InfoItem icon={<Bath size={14} />}>
                {bathrooms ?? "—"}{" "}
                {bathrooms === 1 ? "bagno" : "bagni"}
              </InfoItem>

              <InfoItem icon={<UserRound size={14} />}>
                <span className="text-[#6F7E8A]">
                  Proprietario
                </span>

                <strong className="font-semibold text-[#E8E1D5]">
                  {ownerName}
                </strong>
              </InfoItem>
            </div>
          </div>

          <div className="relative shrink-0 overflow-hidden rounded-2xl border border-[#D8B367]/20 bg-gradient-to-br from-[#0D1923] via-[#09131C] to-[#07111A] px-5 py-4 xl:min-w-[245px]">
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#D8B367]/10 blur-2xl" />

            <div className="relative flex items-center justify-between gap-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#D8B367] text-[#07111A]">
                    <Crown size={15} />
                  </span>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#D8B367]">
                      Victory Score
                    </p>

                    <p className="mt-0.5 text-[10px] font-medium text-[#6F7E8A]">
                      Performance immobile
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-1.5">
                  <ShieldCheck
                    size={13}
                    className="text-emerald-400"
                  />

                  <span className="text-[10px] font-medium text-[#A4AFB8]">
                    {formatLabel(commercialClass)}
                  </span>
                </div>
              </div>

              <div className="border-l border-white/[0.08] pl-5 text-right">
                <div className="flex items-baseline justify-end">
                  <span className="text-3xl font-bold tracking-[-0.04em] text-[#FFF8EA]">
                    {currentScore}
                  </span>

                  <span className="ml-1 text-[10px] font-semibold text-[#6F7E8A]">
                    /100
                  </span>
                </div>

                <p className="mt-1 text-[9px] font-medium text-[#6F7E8A]">
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
        "inline-flex min-h-9 items-center gap-2 rounded-xl border border-white/[0.07] bg-[#07111A]/70 px-2.5 py-1.5 text-xs text-[#A4AFB8]",
        wide ? "sm:max-w-md" : "",
      ].join(" ")}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#D8B367]/[0.07] text-[#D8B367] ring-1 ring-[#D8B367]/15">
        {icon}
      </span>

      <span className="flex min-w-0 items-center gap-1.5">
        {children}
      </span>
    </div>
  );
}

function formatPropertyStatus(status: string) {
  const labels: Record<string, string> = {
    DRAFT: "Bozza",
    ACTIVE: "Attivo",
    MAINTENANCE: "Manutenzione",
    OFFLINE: "Offline",
    ARCHIVED: "Archiviato",
  };

  return labels[status] ?? formatLabel(status);
}

function formatLabel(value: string) {
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