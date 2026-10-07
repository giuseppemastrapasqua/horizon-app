import { Panel } from "@/components/ui/Panel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { PropertyCard } from "@/components/business/PropertyCard";
import { EmptyState } from "@/components/ui/EmptyState";

type MonthlyPerformance = {
  label: string;
  revenue: number;
  bookings: number;
};

type FirstBooking = {
  id: string;
  checkIn: Date;
  nights: number;
};

type NextMonth = {
  label: string;
  bookings: number;
  nights: number;
  occupancyRate: number;
  grossRevenue: number;
  firstBooking: FirstBooking | null;
};

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
  monthlyPerformance: MonthlyPerformance[];
  nextMonth: NextMonth;
};

type Props = {
  properties: OwnerProperty[];
};

export function OwnerProperties({
  properties,
}: Props) {
  return (
    <Panel dark>
      <SectionTitle
        dark
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
              dark
            />
          ))}
        </div>
      )}
    </Panel>
  );
}
