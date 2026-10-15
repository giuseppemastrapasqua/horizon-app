import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { getAuthorizedDocument } from "@/lib/documents/get-authorized-document";

export default async function DocumentVersionsPage({
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
      <AppShell title="Cronologia documento" subtitle={document.title}>
        <Link href={`/documents/${id}`}>← Documento</Link>
        <div className="mt-5 space-y-3">
          {document.versions.map((version) => (
            <section
              key={version.id}
              className="rounded-xl border border-white/10 p-5"
            >
              <p>
                Versione {version.version} ·{" "}
                {version.createdAt.toLocaleDateString("it-IT", {
                  timeZone: "UTC",
                })}
              </p>
              {version.note && (
                <p className="mt-2 text-sm text-white/60">{version.note}</p>
              )}
            </section>
          ))}
          {!document.versions.length && (
            <p>
              Versione corrente: {document.currentVersion}. Nessuna versione
              precedente archiviata.
            </p>
          )}
        </div>
      </AppShell>
    </>
  );
}
