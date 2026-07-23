import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emitEvent } from "@/lib/events/emit";
import { processPendingEvents } from "@/lib/events/process-pending";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        success: false,
        error: "Route di test non disponibile in produzione.",
      },
      {
        status: 403,
      }
    );
  }

  const booking = await prisma.booking.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      propertyId: true,
      guestName: true,
    },
  });

  if (!booking) {
    return NextResponse.json(
      {
        success: false,
        error: "Nessuna prenotazione disponibile per il test.",
      },
      {
        status: 404,
      }
    );
  }

  const testRunId = Date.now();

  const emittedEvent = await emitEvent({
    eventType: "BOOKING_CREATED",
    aggregateType: "BOOKING",
    aggregateId: booking.id,
    payload: {
      bookingId: booking.id,
      propertyId: booking.propertyId,
      guestName: booking.guestName,
      test: true,
    },
    idempotencyKey: `TEST:BOOKING_CREATED:${booking.id}:${testRunId}`,
  });

  const processingResult = await processPendingEvents({
    limit: 20,
  });

  const storedEvent = await prisma.systemEvent.findUnique({
    where: {
      id: emittedEvent.id,
    },
    select: {
      id: true,
      eventType: true,
      status: true,
      attempts: true,
      lastError: true,
      processedAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    booking,
    emittedEvent,
    processingResult,
    storedEvent,
  });
}