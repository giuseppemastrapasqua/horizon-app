import {
  generatePropertyIcalExport,
} from "@/lib/integrations/ical-export/generate-property-ical-export";

import {
  isIcalExportDestination,
  verifyIcalExportToken,
} from "@/lib/integrations/ical-export/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    propertyId: string;
    destination: string;
    token: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const params = await context.params;

  const propertyId = params.propertyId.trim();

  const destination = params.destination
    .trim()
    .toUpperCase();

  const token = params.token.trim();

  if (
    !propertyId ||
    !isIcalExportDestination(destination) ||
    !verifyIcalExportToken({
      propertyId,
      destination,
      token,
    })
  ) {
    return new Response("Calendar not found.", {
      status: 404,
    });
  }

  const calendar =
    await generatePropertyIcalExport({
      propertyId,
      destination,
    });

  if (!calendar) {
    return new Response("Calendar not found.", {
      status: 404,
    });
  }

  return new Response(calendar, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition":
        'inline; filename="horizon-calendar.ics"',
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
