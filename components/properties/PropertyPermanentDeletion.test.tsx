import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
vi.mock("@/app/properties/[id]/edit/property-lifecycle-actions", () => ({ deletePropertyWithFeedbackAction: vi.fn() }));
vi.mock("react", async (importOriginal) => ({ ...await importOriginal<typeof import("react")>(), useActionState: () => [{ message: "" }, "/action", false] }));
import { PropertyPermanentDeletion } from "./PropertyPermanentDeletion";
const counts = { bookings: 0, documents: 0, financeFormulas: 0, financeReports: 0, tasks: 0, revenueMarketSnapshots: 0, revenueDailySignals: 0, revenueRecommendations: 0 };
it("explains the protected history before exposing a deletion form", () => {
  const html = renderToStaticMarkup(<PropertyPermanentDeletion propertyId="p1" name="Bovisa Apartment" archived counts={{ ...counts, documents: 1, financeReports: 1 }} />);
  expect(html).toContain("Rendiconti proprietari"); expect(html).toContain("Documenti");
  expect(html).toContain("Eliminazione non disponibile"); expect(html).not.toContain('<form');
  expect(html).toContain("non può essere annullata"); expect(html).not.toContain('pu\\u00F2');
});
it("only exposes the confirmation form for an archived empty property", () => {
  const html = renderToStaticMarkup(<PropertyPermanentDeletion propertyId="p1" name="Casa Demo" archived counts={counts} />);
  expect(html).toContain('name="confirmation"'); expect(html).toContain("Elimina definitivamente");
  expect(html).toContain("disabled");
  const active = renderToStaticMarkup(<PropertyPermanentDeletion propertyId="p1" name="Casa Demo" archived={false} counts={counts} />);
  expect(active).toContain("Archivia prima"); expect(active).not.toContain('<form');
});
