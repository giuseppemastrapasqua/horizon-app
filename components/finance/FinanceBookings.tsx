import type { CSSProperties } from "react";

import Link from "next/link";

import type {
  FinancePreview,
} from "@/lib/finance/preview";

type FinanceBookingsProps = {
  bookings: FinancePreview["bookings"];
  property: FinancePreview["property"];
  referenceMonth: Date;
};

export function FinanceBookings({
  bookings,
  property,
  referenceMonth,
}: FinanceBookingsProps) {
  return (
    <>
      <section style={bookingsPanelStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <div style={sectionEyebrowStyle}>
              MOVIMENTI
            </div>

            <h3 style={sectionTitleStyle}>
              Prenotazioni incluse
            </h3>
          </div>

          <span style={countBadgeStyle}>
            {bookings.length}
          </span>
        </div>

        {bookings.length === 0 ? (
          <div style={emptyStateStyle}>
            Nessuna prenotazione con check-in nel
            mese di {formatMonth(referenceMonth)}.
          </div>
        ) : (
          <div style={bookingListStyle}>
            {bookings.map((booking) => (
              <article
                key={booking.id}
                style={bookingRowStyle}
              >
                <div>
                  <Link
                    href={`/bookings/${booking.id}`}
                    style={bookingTitleStyle}
                  >
                    {booking.guestName}
                  </Link>

                  <div style={bookingMetaStyle}>
                    {formatDate(booking.checkIn)} →{" "}
                    {formatDate(booking.checkOut)}
                    {" · "}
                    {booking.nights} notti
                    {" · "}
                    {booking.channel}
                  </div>
                </div>

                <strong style={amountStyle}>
                  {formatCurrency(
                    Number(booking.grossAmount),
                    booking.currency
                  )}
                </strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <div style={propertyReferenceStyle}>
        Rendiconto di riferimento:{" "}
        <Link
          href={`/properties/${property.id}`}
          style={propertyLinkStyle}
        >
          {property.name}
        </Link>
      </div>
    </>
  );
}

function formatCurrency(
  value: number,
  currency: string
) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency,
  }).format(value);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(
    "it-IT"
  ).format(date);
}

function formatMonth(date: Date) {
  const value = new Intl.DateTimeFormat(
    "it-IT",
    {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date);

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

const bookingsPanelStyle: CSSProperties = {
  padding: "22px",
  border: "1px solid #e2e8f0",
  borderRadius: "20px",
  background: "#ffffff",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  marginBottom: "18px",
};

const sectionEyebrowStyle: CSSProperties = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const sectionTitleStyle: CSSProperties = {
  margin: "5px 0 0",
  color: "#0f172a",
  fontSize: "21px",
};

const countBadgeStyle: CSSProperties = {
  minWidth: "34px",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "#f1f5f9",
  color: "#334155",
  textAlign: "center",
  fontWeight: 700,
};

const bookingListStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
};

const bookingRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  padding: "14px",
  border: "1px solid #e2e8f0",
  borderRadius: "14px",
  background: "#f8fafc",
  flexWrap: "wrap",
};

const bookingTitleStyle: CSSProperties = {
  color: "#0f172a",
  fontWeight: 800,
  textDecoration: "none",
};

const bookingMetaStyle: CSSProperties = {
  marginTop: "4px",
  color: "#64748b",
  fontSize: "13px",
};

const amountStyle: CSSProperties = {
  color: "#0f172a",
  fontSize: "16px",
};

const emptyStateStyle: CSSProperties = {
  padding: "24px",
  borderRadius: "14px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center",
};

const propertyReferenceStyle: CSSProperties = {
  marginTop: "14px",
  color: "#64748b",
  fontSize: "13px",
  textAlign: "right",
};

const propertyLinkStyle: CSSProperties = {
  color: "#2563eb",
  fontWeight: 700,
  textDecoration: "none",
};