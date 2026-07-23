"use client";

import { useMemo, useState } from "react";
import { OperationalCard } from "@/components/intelligence";
import {
  StudioHeader,
  StudioLayout,
  StudioPreview,
  StudioPreviewItem,
  StudioPreviewSection,
  StudioTable,
  StudioToolbar,
  type StudioColumn,
} from "@/components/studio";
import { ActionButton } from "@/components/ui/ActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getBookingOperationalInsights } from "@/lib/bookings/get-booking-operational-insights";
import { formatCurrency } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { ActivityFeed } from "@/components/activity";
import { getBookingActivity } from "@/lib/activity";

type BookingStudioItem = {
  id: string;
  guestName: string;
  guestEmail: string | null;
  property: {
    id: string;
    name: string;
  };
  channel: string;
  bookingStatus: string;
  operationalStatus: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  grossAmount: number;
  currency: string;
  createdAt: string;
updatedAt: string;
};

type BookingsStudioClientProps = {
  bookings: BookingStudioItem[];
};

export function BookingsStudioClient({
  bookings,
}: BookingsStudioClientProps) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedBookingId, setSelectedBookingId] =
    useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return bookings;
    }

    return bookings.filter((booking) => {
      const searchableValues = [
        booking.guestName,
        booking.guestEmail ?? "",
        booking.property.name,
        booking.channel,
        booking.bookingStatus,
        booking.operationalStatus,
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [bookings, searchValue]);

  const selectedBooking =
    bookings.find(
      (booking) => booking.id === selectedBookingId
    ) ?? null;

  const selectedBookingInsights = selectedBooking
    ? getBookingOperationalInsights(selectedBooking)
    : [];

    const selectedBookingActivity = selectedBooking
  ? getBookingActivity(selectedBooking)
  : [];

  const columns: StudioColumn<BookingStudioItem>[] = [
    {
      key: "guest",
      header: "Ospite",
      width: "230px",
      sortValue: (booking) =>
        booking.guestName.toLowerCase(),
      render: (booking) => (
        <div>
          <strong>{booking.guestName}</strong>

          {booking.guestEmail ? (
            <div style={secondaryTextStyle}>
              {booking.guestEmail}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      key: "property",
      header: "Immobile",
      width: "220px",
      sortValue: (booking) =>
        booking.property.name.toLowerCase(),
      render: (booking) => (
        <strong>{booking.property.name}</strong>
      ),
    },
    {
      key: "stay",
      header: "Soggiorno",
      width: "190px",
      sortValue: (booking) =>
        new Date(booking.checkIn),
      render: (booking) => (
        <div>
          <div>
            {formatDate(new Date(booking.checkIn))}
            {" → "}
            {formatDate(new Date(booking.checkOut))}
          </div>

          <div style={secondaryTextStyle}>
            {booking.nights} notti · {booking.guests} ospiti
          </div>
        </div>
      ),
    },
    {
      key: "channel",
      header: "Canale",
      width: "130px",
      sortValue: (booking) => booking.channel,
      render: (booking) => (
        <StatusBadge
          label={booking.channel}
          tone="blue"
          compact
        />
      ),
    },
    {
      key: "bookingStatus",
      header: "Prenotazione",
      width: "150px",
      sortValue: (booking) =>
        booking.bookingStatus,
      render: (booking) => (
        <StatusBadge
          label={booking.bookingStatus}
          compact
        />
      ),
    },
    {
      key: "operationalStatus",
      header: "Operativo",
      width: "150px",
      sortValue: (booking) =>
        booking.operationalStatus,
      render: (booking) => (
        <StatusBadge
          label={booking.operationalStatus}
          compact
        />
      ),
    },
    {
      key: "amount",
      header: "Importo",
      width: "140px",
      align: "right",
      sortValue: (booking) =>
        booking.grossAmount,
      render: (booking) => (
        <strong>
          {formatCurrency(
            booking.grossAmount,
            booking.currency
          )}
        </strong>
      ),
    },
  ];

  return (
    <div style={pageStyle}>
      <StudioHeader
        title="Prenotazioni"
        description="Cerca, controlla e apri rapidamente ogni soggiorno."
        actions={
          <ActionButton
            label="Nuova prenotazione"
            href="/bookings/new"
          />
        }
      />

      <StudioToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Cerca ospite, immobile, email o stato..."
      />

      <StudioLayout
        main={
          <StudioTable
            data={filteredBookings}
            columns={columns}
            getRowKey={(booking) => booking.id}
            onRowClick={(booking) =>
              setSelectedBookingId(booking.id)
            }
            selectedRowKey={selectedBookingId}
            emptyTitle="Nessuna prenotazione trovata"
            emptyDescription="Prova a modificare il termine di ricerca."
          />
        }
        preview={
          selectedBooking ? (
            <StudioPreview
              eyebrow="Prenotazione"
              title={selectedBooking.guestName}
              subtitle={selectedBooking.property.name}
              onClose={() => setSelectedBookingId(null)}
              actions={
                <>
                  <ActionButton
                    label="Apri workspace"
                    href={`/bookings/${selectedBooking.id}`}
                  />

                  <ActionButton
                    label="Apri immobile"
                    href={`/properties/${selectedBooking.property.id}`}
                    variant="secondary"
                  />
                </>
              }
            >
              <StudioPreviewSection title="Operatività">
                <OperationalCard
                  title="Operational status"
                  subtitle="Sintesi automatica della prenotazione"
                  insights={selectedBookingInsights}
                />
              </StudioPreviewSection>

              <StudioPreviewSection title="Attività">
              <ActivityFeed items={selectedBookingActivity} />
              </StudioPreviewSection>

              <StudioPreviewSection title="Soggiorno">
                <StudioPreviewItem
                  label="Check-in"
                  value={formatDate(
                    new Date(selectedBooking.checkIn)
                  )}
                />

                <StudioPreviewItem
                  label="Check-out"
                  value={formatDate(
                    new Date(selectedBooking.checkOut)
                  )}
                />

                <StudioPreviewItem
                  label="Durata"
                  value={`${selectedBooking.nights} notti`}
                />

                <StudioPreviewItem
                  label="Ospiti"
                  value={selectedBooking.guests}
                />
              </StudioPreviewSection>

              <StudioPreviewSection title="Stato">
                <StudioPreviewItem
                  label="Canale"
                  value={
                    <StatusBadge
                      label={selectedBooking.channel}
                      tone="blue"
                      compact
                    />
                  }
                />

                <StudioPreviewItem
                  label="Booking"
                  value={
                    <StatusBadge
                      label={selectedBooking.bookingStatus}
                      compact
                    />
                  }
                />

                <StudioPreviewItem
                  label="Operativo"
                  value={
                    <StatusBadge
                      label={
                        selectedBooking.operationalStatus
                      }
                      compact
                    />
                  }
                />
              </StudioPreviewSection>

              <StudioPreviewSection title="Economico">
                <StudioPreviewItem
                  label="Importo"
                  value={formatCurrency(
                    selectedBooking.grossAmount,
                    selectedBooking.currency
                  )}
                />
              </StudioPreviewSection>
            </StudioPreview>
          ) : undefined
        }
        footer={
          <div style={footerStyle}>
            {filteredBookings.length} di {bookings.length} prenotazioni
          </div>
        }
      />
    </div>
  );
}

const pageStyle = {
  display: "grid",
  gap: "20px",
};

const secondaryTextStyle = {
  marginTop: "4px",
  fontSize: "12px",
  color: "#64748b",
};

const footerStyle = {
  width: "100%",
  fontSize: "13px",
  color: "#64748b",
  textAlign: "right" as const,
};