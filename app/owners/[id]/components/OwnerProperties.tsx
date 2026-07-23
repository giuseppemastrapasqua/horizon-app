import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PropertyCard } from "@/components/business/PropertyCard";
import { EmptyState } from "@/components/ui/EmptyState";

type OwnerProperty = {
  id: string;
  name: string;
  city: string;
  zone: string | null;

  status: string;
  commercialClass: string;

  currentScore: number;

  bookingsCount: number;
  futureBookingsCount: number;
  openTasksCount: number;

  revenue: number;
};

type Props = {
  properties: OwnerProperty[];
};

export function OwnerProperties({
  properties,
}: Props) {
  return (
    <Panel>
      <SectionTitle
        title="Portfolio immobili"
        subtitle="Performance e situazione operativa."
      />

      {properties.length === 0 ? (
        <EmptyState
          title="Nessun immobile collegato"
          description="Il proprietario non dispone ancora di immobili nel portfolio."
          actionLabel="Apri immobili"
          actionHref="/properties"
        />
      ) : (
        <div
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}