import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { getAuthorizedDocument } from "@/lib/documents/get-authorized-document";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const document = await getAuthorizedDocument(id);
  if (!document) notFound();
  return (
    <>
      <Navigation />
      <AppShell
        title={document.title}
        subtitle={document.subtitle ?? undefined}
      >
        <Link href="/documents">← Documenti</Link>
        <section className="mt-5 space-y-4 rounded-2xl border border-white/10 p-6">
          <p>{document.property?.name ?? "Documento generale"}</p>
          <p>
            {document.type} · {document.status} · Versione{" "}
            {document.currentVersion}
          </p>
          {document.documentNumber && <p>Numero: {document.documentNumber}</p>}
          {document.referenceMonth && (
            <p>
              {document.referenceMonth.toLocaleDateString("it-IT", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </p>
          )}
          <div className="flex flex-wrap gap-5">
            <Link href={`/documents/${document.id}/versions`}>
              Cronologia versioni
            </Link>
            {document.type === "COMMISSION_INVOICE" && (
              <Link
                href={`/invoices/${document.id}/pdf`}
                className="text-[#D8B367]"
              >
                Scarica fattura PDF
              </Link>
            )}
            {document.propertyId && (
              <Link href={`/reports/finance?propertyId=${document.propertyId}`}>
                Rendiconti della struttura
              </Link>
            )}
          </div>
        </section>
      </AppShell>
    </>
  );
}
