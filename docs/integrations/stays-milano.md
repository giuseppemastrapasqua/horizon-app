# Stays Milano: catalog and calendar

The owner-private Stays Milano site calls `GET /api/stays/catalog` server-to-server.
Horizon requires a dedicated 32-byte random `STAYS_SERVICE_TOKEN` and an explicit
`STAYS_PROPERTY_IDS` allowlist. The site stores the same token as its server-only
`HORIZON_STAYS_TOKEN` secret. No browser receives this credential.

The endpoint is read-only, excludes inactive/archived properties and cancelled
bookings, and checks half-open stay intervals [check-in, check-out). Availability
blocks use the same interval convention. It returns aggregate availability only;
no booking identifiers, guest data, owner data, costs, commissions or internal
notes are returned. All responses use no-store, including failures.

A clear calendar means no conflicting record in Horizon, not an instant booking
promise. The site displays synchronization freshness and requires final confirmation.
A failed read never produces an available calendar. No booking, payment, email,
OTA update or financial report is created by this integration.

Direct rates are not approved/configured in current production; price is null,
never zero or a generated recommendation. Historic local photo URLs are broken
on the current deployment and excluded. New photos in the configured public
property-images bucket are eligible automatically.

The site remains owner-private and noindex. Public domain/Google work, approved
direct tariffs and booking/payment workflow remain separate follow-up work.
