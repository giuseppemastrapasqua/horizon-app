import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { property: { findMany } } }));
import { GET } from "./route";
const request = (query = "") => new Request("https://horizon.test/api/stays/catalog"+query, { headers: { authorization: "Bearer " + "a".repeat(64) } });
beforeEach(() => { vi.stubEnv("STAYS_SERVICE_TOKEN", "a".repeat(64)); vi.stubEnv("STAYS_PROPERTY_IDS", "live-property"); findMany.mockReset(); });
afterEach(() => vi.unstubAllEnvs());
describe("Stays read-only catalog", () => {
  it("does not query data without the service credential", async () => {
    expect((await GET(new Request("https://horizon.test/api/stays/catalog"))).status).toBe(401);
    expect(findMany).not.toHaveBeenCalled();
  });
  it("filters active allowed properties and excludes cancelled bookings with checkout-exclusive overlap", async () => {
    findMany.mockResolvedValue([]);
    expect((await GET(request("?from=2026-12-01&to=2026-12-03"))).status).toBe(200);
    const query=findMany.mock.calls[0][0];
    expect(query.where).toMatchObject({id:{in:["live-property"]},status:"ACTIVE"});
    expect(query.select.bookings.where).toEqual({bookingStatus:{not:"CANCELLED"},checkIn:{lt:new Date("2026-12-03")},checkOut:{gt:new Date("2026-12-01")}});
    expect(query.select.bookings.select).toEqual({id:true});
  });
  it("only returns listing fields and no guest, owner or internal booking data", async () => {
    findMany.mockResolvedValue([{id:"live-property",name:"Casa",address:"Via Test",city:"Milano",zone:"Centro",description:null,maxGuests:4,bedrooms:1,bathrooms:1,cin:null,cir:null,images:[],amenities:[],integrationConnections:[],bookings:[{id:"hidden-booking"}],availabilityBlocks:[],ownerId:"private-owner",guestEmail:"private@example.com",notes:"private"}]);
    const body=await (await GET(request("?from=2026-12-01&to=2026-12-03"))).json();
    expect(body.properties[0].availability).toBe("BLOCKED");
    expect(body.properties[0].price).toBeNull();
    expect(JSON.stringify(body)).not.toMatch(/private|hidden-booking/);
  });
  it("never treats a failed database read as an empty available calendar", async () => {
    findMany.mockRejectedValue(new Error("private connection"));
    const response=await GET(request());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("private connection");
  });
});
