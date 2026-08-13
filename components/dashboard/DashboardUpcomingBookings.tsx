import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";
import {
  StatusPanel,
  StatusPanelRow,
} from "@/components/ui/StatusPanel";
import type {
  DashboardUpcomingCheckIn,
  DashboardUpcomingCheckOut,
} from "@/lib/dashboard/types";

type DashboardUpcomingBookingsProps = {
  nextCheckIns: DashboardUpcomingCheckIn[];
  nextCheckOuts: DashboardUpcomingCheckOut[];
};

export function DashboardUpcomingBookings({
  nextCheckIns,
  nextCheckOuts,
}: DashboardUpcomingBookingsProps) {
  return (
    <section style={gridStyle}>
      <StatusPanel title="Check-in in arrivo" tone="green">
        {nextCheckIns.length === 0 ? (
          <EmptyState
            title="Nessun check-in in arrivo"
            description="Non risultano arrivi imminenti."
          />
        ) : (
          nextCheckIns.map((booking) => (
            <StatusPanelRow key={booking.id} tone="green">
              <Link
                href={`/bookings/${booking.id}`}
                style={bookingLinkStyle}
              >
                {booking.guestName}
              </Link>

              <span>
                {booking.property.name} ·{" "}
                {booking.checkIn.toLocaleDateString("it-IT")} ·{" "}
                {booking.channel}
              </span>
            </StatusPanelRow>
          ))
        )}
      </StatusPanel>

      <StatusPanel title="Check-out in arrivo" tone="red">
        {nextCheckOuts.length === 0 ? (
          <EmptyState
            title="Nessun check-out in arrivo"
            description="Non risultano partenze imminenti."
          />
        ) : (
          nextCheckOuts.map((booking) => (
            <StatusPanelRow key={booking.id} tone="red">
              <Link
                href={`/bookings/${booking.id}`}
                style={bookingLinkStyle}
              >
                {booking.guestName}
              </Link>

              <span>
                {booking.property.name} ·{" "}
                {booking.checkOut.toLocaleDateString("it-IT")} ·{" "}
                {booking.channel}
              </span>
            </StatusPanelRow>
          ))
        )}
      </StatusPanel>
    </section>
  );
}

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "22px",
  marginBottom: "22px",
};

const bookingLinkStyle = {
  color: "inherit",
  fontWeight: 900,
  textDecoration: "none",
};