app\api\events\test-booking-created\route.ts:61: const storedEvent = await prisma.systemEvent.findUnique({
app\api\search\route.ts:41: externalBookingId: {
app\bookings\[id]\components\BookingHero.tsx:17: externalBookingId: string | null;
app\bookings\[id]\components\BookingHero.tsx:226: {booking.externalBookingId ??
app\bookings\new\page.tsx:72: <option value="AIRBNB">Airbnb</option>
app\bookings\actions.ts:279: case "AIRBNB":
app\bookings\actions.ts:280: return BookingChannel.AIRBNB;
app\bookings\actions.ts:285: case "VRBO":
app\bookings\actions.ts:286: return BookingChannel.VRBO;
app\imperium\[id]\page.tsx:159: event.externalEventId ?? "Non presente"
lib\bookings\get-booking-workspace.ts:96: externalBookingId: booking.externalBookingId,
lib\dashboard\get-command-center.ts:122: prisma.systemEvent.count({
lib\dashboard\get-command-center.ts:130: prisma.systemEvent.count({
lib\events\handlers\booking-created.ts:1: import type { SystemEvent } from "@prisma/client";
lib\events\handlers\booking-created.ts:9: event: SystemEvent
lib\events\handlers\index.ts:1: import type { SystemEvent } from "@prisma/client";
lib\events\handlers\index.ts:5: event: SystemEvent
lib\events\dispatcher.ts:2: SystemEventStatus,
lib\events\dispatcher.ts:3: type SystemEvent,
lib\events\dispatcher.ts:10: event: SystemEvent
lib\events\dispatcher.ts:17: await prisma.systemEvent.update({
lib\events\dispatcher.ts:22: status: SystemEventStatus.COMPLETED,
lib\events\dispatcher.ts:31: await prisma.systemEvent.update({
lib\events\dispatcher.ts:36: status: SystemEventStatus.PROCESSING,
lib\events\dispatcher.ts:50: await prisma.systemEvent.update({
lib\events\dispatcher.ts:55: status: SystemEventStatus.COMPLETED,
lib\events\dispatcher.ts:66: await prisma.systemEvent.update({
lib\events\dispatcher.ts:71: status: SystemEventStatus.FAILED,
lib\events\emit.ts:2: SystemEventSource,
lib\events\emit.ts:13: const existingEvent = await prisma.systemEvent.findUnique({
lib\events\emit.ts:29: const event = await prisma.systemEvent.create({
lib\events\emit.ts:34: source: input.source ?? SystemEventSource.HORIZON,
lib\events\emit.ts:37: externalEventId: input.externalEventId ?? null,
lib\events\process-pending.ts:1: import { SystemEventStatus } from "@prisma/client";
lib\events\process-pending.ts:16: const events = await prisma.systemEvent.findMany({
lib\events\process-pending.ts:20: SystemEventStatus.PENDING,
lib\events\process-pending.ts:21: SystemEventStatus.FAILED,
lib\events\types.ts:3: SystemEventSource,
lib\events\types.ts:31: source?: SystemEventSource;
lib\events\types.ts:34: externalEventId?: string;
lib\imperium\monitor\get-monitor-event.ts:6: return prisma.systemEvent.findUnique({
lib\imperium\monitor\get-monitor-event.ts:19: externalEventId: true,
lib\imperium\monitor\get-monitor-events.ts:4: const events = await prisma.systemEvent.findMany({
lib\imperium\workflow\executor.ts:1: import type { SystemEvent } from "@prisma/client";
lib\imperium\workflow\executor.ts:19: event: SystemEvent
lib\imperium\workflow\types.ts:1: import type { SystemEvent } from "@prisma/client";
lib\imperium\workflow\types.ts:15: event: SystemEvent;
lib\job\dispatch-background-job.ts:44: PROPERTY_SYNC:
lib\job\dispatch-background-job.ts:46: "PROPERTY_SYNC",
lib\job\dispatch-background-job.ts:49: BOOKING_SYNC:
lib\job\dispatch-background-job.ts:51: "BOOKING_SYNC",
lib\pdf\finance-report.ts:1244: channel === "BOOKING_COM"
lib\pdf\finance-report.ts:1249: if (channel === "AIRBNB") {
lib\pdf\finance-report.ts:1250: return "Airbnb";
lib\prisma.ts:3: type PrismaClientWithSystemEvent = PrismaClient & {
lib\prisma.ts:4: systemEvent?: unknown;
lib\prisma.ts:8: prisma?: PrismaClientWithSystemEvent;
lib\prisma.ts:14: cachedPrisma?.systemEvent
