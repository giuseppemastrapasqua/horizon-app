import { readRevenueSplit, recipientIndex, splitStatement } from "@/lib/finance/report-revenue-split";
import { requirePropertyAccess, requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { readReportBookingSnapshot } from "@/lib/finance/report-booking-snapshot";
import { buildPropertyMonthlyStatement } from "@/lib/finance/property-monthly-statement";
import { buildPropertyMonthlyStatementPdf } from "@/lib/pdf/property-monthly-statement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export async function GET(_request: Request, context: { params: Promise<{ reportId: string }> }) {
  const user = await requireUser();
  if (!["SUPER_ADMIN", "MANAGER", "FINANCE_ADMIN", "OWNER"].includes(user.role))
    return new Response("Accesso non autorizzato.", { status: 403, headers });
  const { reportId } = await context.params;
  if (!reportId.trim()) return new Response("Identificativo non valido.", { status: 400, headers });
  const report = await prisma.financeReport.findUnique({
    where: { id: reportId.trim() },
    select: {
      id: true, referenceMonth: true, createdAt: true, currency: true,
      grossRevenue: true, finalAmount: true, formulaSnapshot: true,
      property: { select: { id: true, name: true, address: true, city: true } },
      owner: { select: { fullName: true } },
      adjustments: { orderBy: { createdAt: "asc" }, select: { description: true, amount: true } },
    },
  });
  if (!report) return new Response("Rendiconto non trovato.", { status: 404, headers });
  try { await requirePropertyAccess(report.property.id); }
  catch (error) {
    if (error instanceof Error && error.message === "Accesso alla struttura non autorizzato.")
      return new Response("Rendiconto non trovato.", { status: 404, headers });
    throw error;
  }
  let saved;
  try { saved = readReportBookingSnapshot(report.formulaSnapshot); }
  catch { return new Response("Dettaglio salvato non valido. Richiedere una verifica del rendiconto originale.", { status: 422, headers }); }
  const missingReferences = (saved ?? []).filter((item) => !item.externalBookingId).map((item) => item.id);
  const references = missingReferences.length ? await prisma.booking.findMany({
    where: { propertyId: report.property.id, id: { in: missingReferences } },
    select: { id: true, externalBookingId: true },
  }) : [];
  let statement;
  try {
    statement = buildPropertyMonthlyStatement({
      ...report, grossRevenue: Number(report.grossRevenue), finalAmount: Number(report.finalAmount),
      adjustments: report.adjustments.map((item) => ({ ...item, amount: Number(item.amount) })),
    }, references);
  } catch {
    return new Response("Dettaglio salvato non valido. Richiedere una verifica del rendiconto originale.", { status: 422, headers });
  }
  const shareKey = new URL(_request.url).searchParams.get("share");
  const split = readRevenueSplit(report.formulaSnapshot, report.referenceMonth);
  const shareIndex = shareKey ? recipientIndex(split, shareKey) : -1;
  if (shareKey && (user.role === "OWNER" || !split || shareIndex < 0)) return new Response("Quota non disponibile.", { status: 404, headers });
  if (shareKey && split) statement = splitStatement(statement, split, shareIndex);
  const bytes = await buildPropertyMonthlyStatementPdf(statement);
  const period = report.referenceMonth.toISOString().slice(0, 7);
  const safeId = report.id.replace(/[^a-zA-Z0-9-]/g, "");
  return new Response(Buffer.from(bytes), { headers: {
    ...headers, "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${shareKey ? `quota-${shareKey}-` : ""}rendiconto-mensile-proprieta-${period}-${safeId}.pdf"`,
  } });
}
