import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ScoreCard } from "@/components/ui/ScoreCard";
import { SectionTitle } from "@/components/ui/SectionTitle";

export type PropertyCardData = {
  id: string;
  name: string;
  city: string;
  zone: string | null;

  status: string;
  commercialClass: string;

  currentScore: number;

  revenue: number;

  bookingsCount: number;
  futureBookingsCount: number;
  openTasksCount: number;
};

type PropertyCardProps = {
  property: PropertyCardData;
};

export function PropertyCard({
  property,
}: PropertyCardProps) {
  return (
    <Panel>
      <SectionTitle
        title={property.name}
        subtitle={`${property.zone ?? property.city} • ${property.commercialClass.replaceAll("_", " ")}`}
        action={<StatusBadge label={property.status} />}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 180px",
          gap: "20px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(140px,1fr))",
            gap: "14px",
          }}
        >
          <Info
            title="Ricavi"
            value={formatCurrency(property.revenue)}
          />

          <Info
            title="Booking"
            value={property.bookingsCount}
          />

          <Info
            title="Booking futuri"
            value={property.futureBookingsCount}
          />

          <Info
            title="Task aperti"
            value={property.openTasksCount}
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: "10px",
          }}
        >
          <ScoreCard
            score={property.currentScore}
            label={property.commercialClass.replaceAll("_", " ")}
          />

          <Link
            href={`/properties/${property.id}`}
            style={{
              textAlign: "center",
              textDecoration: "none",
              padding: "10px",
              borderRadius: "12px",
              background: "#0f172a",
              color: "white",
              fontWeight: 800,
            }}
          >
            Apri immobile →
          </Link>
        </div>
      </div>
    </Panel>
  );
}

function Info({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div>
      <div
        style={{
          color: "#94a3b8",
          fontSize: "11px",
          marginBottom: "4px",
        }}
      >
        {title}
      </div>

      <strong
        style={{
          fontSize: "15px",
          color: "#0f172a",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}