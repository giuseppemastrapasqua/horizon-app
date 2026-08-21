import Link from "next/link";

import {
  ArrowRight,
  FileText,
  FolderOpen,
} from "lucide-react";

import {
  StatusBadge,
} from "@/components/ui/StatusBadge";

export type PropertyDocumentItem = {
  id: string;
  propertyId: string;
  type: string;
  title: string;
  documentNumber: string | null;
  issuer: string | null;
  issueDate: Date | null;
  expiryDate: Date | null;
  validity: string;
  fileUrl: string | null;
  filename: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PropertyDocumentsProps = {
  propertyId: string;
  documents:
    PropertyDocumentItem[];
};

export function PropertyDocuments({
  propertyId,
  documents,
}: PropertyDocumentsProps) {
  return (
    <section className="h-full rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FolderOpen size={14} />
            </span>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-blue-600">
                Documenti
              </p>

              <h2 className="mt-0.5 text-base font-bold tracking-tight text-slate-900">
                Documentazione immobile
              </h2>
            </div>
          </div>

          <p className="mt-2 text-[10px] text-slate-500">
            Licenze, certificazioni e documenti amministrativi.
          </p>
        </div>

        <Link
          href={`/properties/${propertyId}/edit`}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          Gestisci documenti
        </Link>
      </div>

      {documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-5 text-center">
          <FileText
            size={18}
            className="mx-auto text-blue-500"
          />

          <p className="mt-2 text-xs font-semibold text-slate-700">
            Nessun documento registrato
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {documents.map(
            (document) => (
              <article
                key={document.id}
                className="rounded-xl border border-slate-200 bg-slate-50/45 p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-xs font-bold text-slate-900">
                        {document.title}
                      </p>

                      <StatusBadge
                        label={formatValue(
                          document.type,
                        )}
                        tone="blue"
                        compact
                      />

                      <StatusBadge
                        label={formatValue(
                          document.validity,
                        )}
                        compact
                      />
                    </div>

                    <p className="mt-1 text-[9px] text-slate-500">
                      {document.issuer
                        ? `Rilasciato da ${document.issuer}`
                        : "Ente emittente non specificato"}
                    </p>
                  </div>

                  {document.filename ? (
                    <div className="max-w-[150px] rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1.5">
                      <p className="text-[7px] font-bold uppercase tracking-wide text-blue-500">
                        File
                      </p>

                      <p className="mt-0.5 truncate text-[8px] font-semibold text-blue-700">
                        {document.filename}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-4">
                  <Metric
                    label="Numero documento"
                    value={
                      document.documentNumber ??
                      "Non assegnato"
                    }
                  />

                  <Metric
                    label="Data rilascio"
                    value={formatDate(
                      document.issueDate,
                    )}
                  />

                  <Metric
                    label="Data scadenza"
                    value={formatDate(
                      document.expiryDate,
                    )}
                  />

                  <Metric
                    label="Ultimo aggiornamento"
                    value={formatDate(
                      document.updatedAt,
                    )}
                  />
                </div>

                {document.notes ? (
                  <p className="mt-3 border-t border-slate-200 pt-2.5 text-[9px] leading-4 text-slate-500">
                    {document.notes}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-2.5">
                  {document.fileUrl ? (
                    <Link
                      href={document.fileUrl}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[9px] font-semibold text-white transition hover:bg-blue-700"
                    >
                      <FileText size={11} />

                      Apri file

                      <ArrowRight size={10} />
                    </Link>
                  ) : (
                    <span className="text-[8px] text-slate-400">
                      Nessun file allegato
                    </span>
                  )}

                  <span className="text-[8px] text-slate-400">
                    Ultima modifica:{" "}
                    {document.updatedAt.toLocaleString(
                      "it-IT",
                    )}
                  </span>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-[9px] font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function formatDate(
  date:
    Date | null,
) {
  if (!date) {
    return "Non definita";
  }

  return date.toLocaleDateString(
    "it-IT",
  );
}

function formatValue(
  value: string,
) {
  return value.replaceAll(
    "_",
    " ",
  );
}
