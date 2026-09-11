import Link from "next/link";

import type { PropertyListItem } from "@/lib/properties/types";

type PropertyCardProps = {
  property: PropertyListItem;
};

const currencyFormatter = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export function PropertyCard({ property }: PropertyCardProps) {
  const totalRevenue = property.bookings.reduce(
    (sum, booking) => sum + Number(booking.grossAmount),
    0
  );

  const openTasksCount = property.tasks.filter(
    (task) => task.status !== "DONE"
  ).length;

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-[#09131C]/88 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-[24px] font-medium tracking-[-0.02em] text-[#FFF8EA]">
            {property.name}
          </h2>

          <p className="mt-2 text-sm text-[#82909C]">
            {property.address} — {property.zone ?? property.city}
          </p>

          <p className="mt-1 text-sm text-[#82909C]">
            Proprietario:{" "}
            <strong className="font-semibold text-[#D8DEE4]">
              {property.owner.fullName}
            </strong>
          </p>

          <Link
            href={`/properties/${property.id}`}
            className="mt-4 inline-flex items-center text-sm font-semibold text-[#D8B367] transition hover:text-[#E7CC91]"
          >
            Apri centro immobile →
          </Link>
        </div>

        <div className="min-w-[140px] rounded-2xl border border-[#D8B367]/20 bg-[#07111A] px-5 py-4 text-right">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#82909C]">
            Horizon Score
          </div>

          <div className="mt-1 text-[38px] font-semibold leading-none tracking-[-0.03em] text-[#D8B367]">
            {property.currentScore}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric title="Stato" value={property.status} />
        <MiniMetric
          title="Classe commerciale"
          value={property.commercialClass}
        />
        <MiniMetric
          title="Camere"
          value={property.bedrooms ?? "-"}
        />
        <MiniMetric
          title="Bagni"
          value={property.bathrooms ?? "-"}
        />
      </div>

      <div className="mt-4 grid gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <MiniMetric
          title="Prenotazioni"
          value={property.bookings.length}
        />
        <MiniMetric
          title="Task aperti"
          value={openTasksCount}
        />
        <MiniMetric
          title="Ricavo demo"
          value={currencyFormatter.format(totalRevenue)}
        />
        <MiniMetric
          title="Capacità"
          value={`${property.maxGuests} ospiti`}
        />
      </div>
    </section>
  );
}

function MiniMetric({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-[#07111A]/70 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6F7E8A]">
        {title}
      </div>

      <div className="mt-1 text-sm font-semibold text-[#E8E1D5]">
        {value}
      </div>
    </div>
  );
}
