import { hashGuestCheckInToken, isGuestCheckInLinkUsable } from "@/lib/bookings/guest-check-in-token";
import { prisma } from "@/lib/prisma";
import { DUOMO_BOUTIQUE_PROPERTY_ID, verifyGuestGuideReceipt } from "@/lib/bookings/guest-guide";
import { resolveSubmittedGuestTouristTax } from "@/lib/payments/tourist-tax/guest-checkout-status";
import { guideHtml } from "./duomo-guide-html";

export const dynamic = "force-dynamic";

function escapeHtml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const headers = {
    "Cache-Control": "private, no-store",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
    "X-Content-Type-Options": "nosniff",
  };
  if (token.length > 128) return new Response(null, { status: 404, headers });

  const tokenHash = hashGuestCheckInToken(token);
  const link = await prisma.guestCheckInLink.findUnique({
    where: { tokenHash },
    select: {
      expiresAt: true,
      revokedAt: true,
      booking: { select: { id: true, guests: true, propertyId: true, bookingStatus: true } },
    },
  });
  if (!link ||
      link.booking.propertyId !== DUOMO_BOUTIQUE_PROPERTY_ID ||
      link.booking.bookingStatus === "CANCELLED" || link.booking.bookingStatus === "CHECKED_OUT") {
    return new Response("Guida non disponibile / Guide unavailable", { status: 404, headers });
  }

  const canSubmit = isGuestCheckInLinkUsable(link);
  if (!canSubmit && !verifyGuestGuideReceipt(new URL(request.url).searchParams.get("receipt"), tokenHash, link)) {
    return new Response("Guida non disponibile / Guide unavailable", { status: 404, headers });
  }
  let html = guideHtml.replace(
    '<a href="#soggiorno" data-nav="soggiorno">',
    '<a href="#schedine" class="button">Schedine ospiti / Guest registration</a><a href="#soggiorno" data-nav="soggiorno">',
  );
  if (canSubmit) {
    const formPath = `/check-in/${encodeURIComponent(token)}?embedded=1`;
    html = html.replace(
      /<article class="arrival-lock"><h2>Check-in online<\/h2>[\s\S]*?<\/article>/,
      () => `<article id="schedine" class="arrival-lock"><h2>Schedine ospiti / Guest registration</h2><p>Indica quante persone soggiornano e compila una scheda per ciascuna. / Enter how many people are staying, then complete one form per person.</p><iframe id="guest-registration-form" title="Schedine ospiti / Guest registration" src="${formPath}" referrerpolicy="no-referrer" loading="lazy" style="display:block;width:100%;height:75vh;min-height:420px;border:0;border-radius:12px;background:#050b11"></iframe></article>`,
    );
    html = html.replace("</script>", `
const guestFrame = document.getElementById("guest-registration-form");
if (guestFrame) {
  guestFrame.addEventListener("load", () => {
    try {
      const frameBody = guestFrame.contentDocument.body;
      const resize = () => { guestFrame.style.height = Math.max(420, frameBody.scrollHeight) + "px"; };
      new ResizeObserver(resize).observe(frameBody);
      resize();
    } catch {}
  });
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.source !== guestFrame.contentWindow ||
        event.data?.type !== "horizon-guest-check-in-saved" || typeof event.data.guideHref !== "string") return;
    const target = new URL(event.data.guideHref, location.origin);
    if (target.origin !== location.origin || target.pathname !== location.pathname ||
        !/^[A-Za-z0-9_-]{43}$/.test(target.searchParams.get("receipt") || "")) return;
    target.hash = "schedine";
    location.replace(target.href);
  });
}
</script>`);
  }
  if (!canSubmit) {
    const tax = await resolveSubmittedGuestTouristTax(link.booking.id, link.booking.guests)
      .catch(() => ({ status: "UNAVAILABLE" as const }));
    let taxDetails = "<p>Pagamento non disponibile / Payment unavailable</p>";
    if (tax.status === "PAID") taxDetails = "<p>Pagamento confermato / Payment confirmed</p>";
    if (tax.status === "NOT_DUE") taxDetails = "<p>Nessun importo dovuto / No amount due</p>";
    if (tax.status === "READY") {
      const safeUrl = escapeHtml(tax.url);
      taxDetails = `<p>Importo / Amount: €${tax.amount.toFixed(2)}</p><a class="button" href="${safeUrl}" target="_blank" rel="noopener noreferrer">Paga su Stripe / Pay on Stripe</a>`;
    }
    html = html.replace(
      /<article class="arrival-lock"><h2>Check-in online<\/h2>[\s\S]*?<\/article>/,
      () => `<article id="schedine" class="arrival-lock"><h2>Dati ricevuti dalla struttura / Details received by the host</h2><h3>Tassa di soggiorno / Tourist tax</h3>${taxDetails}</article>`,
    );
    if (tax.status === "PAID" || tax.status === "NOT_DUE") {
      const confirmed = await prisma.alloggiatiWebTransmission.findFirst({
        where: { bookingId: link.booking.id, status: "CONFIRMED" },
        select: { id: true },
      });
      const arrival = confirmed ? await prisma.propertyCheckInConfiguration.findUnique({
        where: { propertyId: link.booking.propertyId },
        select: {
          arrivalInstructions: true, accessInstructions: true,
          buildingAccessCode: true, apartmentAccessCode: true,
          wifiName: true, wifiPassword: true, parkingInstructions: true,
        },
      }) : null;
      if (arrival) {
        const rows = [
          ["Indicazioni / Directions", arrival.arrivalInstructions],
          ["Accesso / Access", arrival.accessInstructions],
          ["Codice portone / Building code", arrival.buildingAccessCode],
          ["Codice appartamento / Apartment code", arrival.apartmentAccessCode],
          ["Rete Wi-Fi / Wi-Fi network", arrival.wifiName],
          ["Password Wi-Fi / Wi-Fi password", arrival.wifiPassword],
          ["Parcheggio / Parking", arrival.parkingInstructions],
        ].flatMap(([label, value]) => value
          ? [`<dt><strong>${label}</strong></dt><dd style="margin:0 0 12px;white-space:pre-wrap">${escapeHtml(value)}</dd>`] : []);
        if (rows.length) html = html.replace(
          /<article id="zona" class="arrival-lock">[\s\S]*?<\/article>/,
          () => `<article id="zona" class="arrival-lock"><h2>Come arrivare / Getting here</h2><dl>${rows.join("")}</dl></article>`,
        );
      }
    }
  }
  return new Response(html, {
    headers: {
      ...headers,
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'none'; img-src data:; frame-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    },
  });
}
