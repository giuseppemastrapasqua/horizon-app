import Link from "next/link";

import { DashboardMini } from "@/components/dashboard/DashboardMini";
import { DashboardPanel } from "@/components/dashboard/DashboardPanel";
import { DashboardScoreBadge } from "@/components/dashboard/DashboardScoreBadge";

type MoneyValue =
  | number
  | string
  | {
      toString(): string;
    };

type DashboardPortfolioProperty = {
  id: string;
  name: string;
  zone: string | null;
  city: string;
  commercialClass: string;
  currentScore: number;
  bookings: Array<{
    grossAmount: MoneyValue;
  }>;
  tasks: Array<{
    status: string;
  }>;
};

type DashboardPortfolioPanelProps = {
  properties: DashboardPortfolioProperty[];
};

export function DashboardPortfolioPanel({
  properties,
}: DashboardPortfolioPanelProps) {
  return (
    <DashboardPanel title="Portfolio immobili">
      <div style={portfolioListStyle}>
        {properties.map((property) => {
          const revenue = property.bookings.reduce(
            (sum, booking) => sum + Number(booking.grossAmount),
            0
          );

          const openTasks = property.tasks.filter(
            (task) => task.status !== "DONE"
          );

          return (
            <div key={property.id} style={portfolioRowStyle}>
              <div>
                <Link
                  href={`/properties/${property.id}`}
                  style={portfolioTitleStyle}
                >
                  {property.name}
                </Link>

                <div style={portfolioMetaStyle}>
                  {property.zone ?? property.city} ·{" "}
                  {property.commercialClass}
                </div>
              </div>

              <DashboardScoreBadge value={property.currentScore} />

              <DashboardMini
                label="Ricavi"
                value={`${revenue.toFixed(2)} €`}
              />

              <DashboardMini
                label="Task aperti"
                value={openTasks.length}
              />
            </div>
          );
        })}
      </div>
    </DashboardPanel>
  );
}

const portfolioListStyle = {
  display: "grid",
  gap: "14px",
};

const portfolioRowStyle = {
  display: "grid",
  gridTemplateColumns: "2fr 0.7fr 1fr 1fr",
  gap: "16px",
  padding: "18px",
  borderRadius: "18px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  alignItems: "center",
};

const portfolioTitleStyle = {
  fontSize: "16px",
  color: "#0f172a",
  fontWeight: 800,
  textDecoration: "none",
};

const portfolioMetaStyle = {
  color: "#64748b",
  marginTop: "5px",
};