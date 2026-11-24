import { prisma } from "@/lib/prisma";
import { hasStaysAccess, parseStayQuery, safePhotoUrl, staysPropertyIds } from "@/lib/stays/access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function GET(request: Request) {
  if (!hasStaysAccess(request)) return Response.json({ error: "Accesso non autorizzato." }, { status: 401, headers });
  let query;
  try { query = parseStayQuery(new URL(request.url)); }
  catch (error) { return Response.json({ error: (error as Error).message }, { status: 400, headers }); }
  try {
    const { from, to, guests } = query;
    const properties = await prisma.property.findMany({
      where: { id: { in: staysPropertyIds() }, status: "ACTIVE", maxGuests: { gte: guests } },
      orderBy: { name: "asc" },
      select: {
        id: true, name: true, address: true, city: true, zone: true, description: true,
        maxGuests: true, bedrooms: true, bathrooms: true, cin: true, cir: true,
        images: { orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }], take: 30, select: { url: true, caption: true } },
        amenities: { where: { amenity: { isActive: true } }, select: { amenity: { select: { key: true, label: true } } } },
        integrationConnections: { where: { connection: { enabled: true } }, select: { connection: { select: { lastSyncAt: true, lastSyncStatus: true } } } },
        bookings: { where: { bookingStatus: { not: "CANCELLED" }, ...(from && to ? { checkIn: { lt: to }, checkOut: { gt: from } } : { id: { in: [] } }) }, take: 1, select: { id: true } },
        availabilityBlocks: { where: from && to ? { startDate: { lt: to }, endDate: { gt: from } } : { id: { in: [] } }, take: 1, select: { id: true } },
      },
    });
    return Response.json({
      source: "Horizon", checkedAt: new Date().toISOString(), mode: "READ_ONLY", pricesReady: false,
      from: from?.toISOString().slice(0, 10) ?? null, to: to?.toISOString().slice(0, 10) ?? null, guests,
      properties: properties.map(p => {
        const connections = p.integrationConnections.map(c => c.connection);
        const syncs = connections.map(c => c.lastSyncAt?.getTime() ?? 0);
        const lastSync = syncs.length && syncs.every(Boolean) ? Math.min(...syncs) : null;
        const calendarFresh = Boolean(lastSync && Date.now() - lastSync < 24 * 3600000 && connections.every(c => c.lastSyncStatus === "SUCCESS"));
        return {
          id: p.id, name: p.name, address: p.address, city: p.city, zone: p.zone,
          description: p.description, guests: p.maxGuests, beds: p.bedrooms, baths: p.bathrooms,
          cin: p.cin, cir: p.cir,
          images: p.images.flatMap(i => { const url = safePhotoUrl(i.url); return url ? [{ url, caption: i.caption }] : []; }),
          amenities: p.amenities.map(a => a.amenity),
          availability: !from ? "NOT_CHECKED" : p.bookings.length || p.availabilityBlocks.length ? "BLOCKED" : "NO_CONFLICT_IN_HORIZON",
          calendarFresh, lastSyncAt: lastSync ? new Date(lastSync).toISOString() : null,
          price: null, priceStatus: "DIRECT_RATE_TO_APPROVE",
        };
      }),
    }, { headers });
  } catch (error) {
    console.error("Stays catalog read failed", error instanceof Error ? error.name : "UnknownError");
    return Response.json({ error: "Horizon non è raggiungibile. Riprova tra poco." }, { status: 503, headers });
  }
}
