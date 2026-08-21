
import type {
  PropertyDocumentType,
  PropertyDocumentValidity,
} from "@prisma/client";

import { PropertyDocumentEditor } from "@/components/properties/PropertyDocumentEditor";
import type { PropertyDocumentWorkspaceData } from "@/lib/properties/map-property-documents";

type PropertyDocumentAction = (
  formData: FormData,
) => void | Promise<void>;

type PropertyDocumentsSectionProps = {
  propertyId: string;
  documents: PropertyDocumentWorkspaceData[];
  createAction: PropertyDocumentAction;
  updateAction: PropertyDocumentAction;
  deleteAction: PropertyDocumentAction;
  retryOcrAction: PropertyDocumentAction;
};

const documentTypes: Array<{
  value: PropertyDocumentType;
  label: string;
}> = [
  {
    value: "CIN",
    label: "CIN",
  },
  {
    value: "CIR",
    label: "CIR",
  },
  {
    value: "SCIA",
    label: "SCIA",
  },
  {
    value: "ENERGY_CERTIFICATE",
    label: "Attestato di prestazione energetica",
  },
  {
    value: "INSURANCE",
    label: "Assicurazione",
  },
  {
    value: "IDENTITY_DOCUMENT",
    label: "Documento di identitÃ ",
  },
  {
    value: "FLOOR_PLAN",
    label: "Planimetria",
  },
  {
    value: "CONTRACT",
    label: "Contratto",
  },
  {
    value: "OTHER",
    label: "Altro",
  },
];

const validityOptions: Array<{
  value: PropertyDocumentValidity;
  label: string;
}> = [
  {
    value: "VALID",
    label: "Valido",
  },
  {
    value: "EXPIRING",
    label: "In scadenza",
  },
  {
    value: "EXPIRED",
    label: "Scaduto",
  },
];

export function PropertyDocumentsSection({
  propertyId,
  documents,
  createAction,
  updateAction,
  deleteAction,
  retryOcrAction,
}: PropertyDocumentsSectionProps) {
  return (
    <section
      id="documentazione"
      className="scroll-mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-200 bg-slate-50 px-8 py-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
                DOC
              </span>

              <div>
                <h2 className="text-2xl font-semibold text-slate-950">
                  Documentazione immobile
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Gestisci licenze, certificazioni, contratti e
                  documentazione amministrativa.
                </p>
              </div>
            </div>
          </div>

          <span className="w-fit rounded-full bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700">
            {documents.length}{" "}
            {documents.length === 1
              ? "documento"
              : "documenti"}
          </span>
        </div>
      </div>

      <div className="space-y-8 p-8">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-950">
              Aggiungi documento
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Registra un nuovo documento collegato
              all&apos;immobile.
            </p>
          </div>

          <form
            action={createAction}
            className="space-y-6"
          >
            <input
              type="hidden"
              name="propertyId"
              value={propertyId}
            />

            <DocumentFields />

            <div className="flex justify-end border-t border-slate-200 pt-6">
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Aggiungi documento
              </button>
            </div>
          </form>
        </div>

        <div>
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-950">
              Documenti registrati
            </h3>

            <p className="mt-1 text-sm text-slate-600">
              Aggiorna i dati, le scadenze e gli allegati
              disponibili.
            </p>
          </div>

          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <h4 className="font-semibold text-slate-900">
                Nessun documento registrato
              </h4>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
                Usa il modulo precedente per aggiungere il
                primo documento amministrativo
                dell&apos;immobile.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <PropertyDocumentEditor
                  key={document.id}
                  propertyId={propertyId}
                  documentId={document.id}
                  ocrStatus={document.ocrStatus}
                  updateAction={updateAction}
                  summary={
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-slate-950">
                            {document.title}
                          </h4>

                          <DocumentBadge
                            label={getDocumentTypeLabel(
                              document.type,
                            )}
                            className="bg-blue-100 text-blue-700"
                          />

                          <DocumentBadge
                            label={getValidityLabel(
                              document.validity,
                            )}
                            className={getValidityClassName(
                              document.validity,
                            )}
                          />

                          <DocumentBadge
  label={getOcrStatusLabel(
    document.ocrStatus,
  )}
  className={getOcrStatusClassName(
    document.ocrStatus,
  )}
/>
                        </div>

                        <p className="mt-2 text-sm text-slate-600">
                          {document.documentNumber
                            ? `Numero ${document.documentNumber}`
                            : "Numero documento non specificato"}

                          {document.issuer
                            ? ` Â· ${document.issuer}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {document.expiryDate
                            ? `Scadenza ${document.expiryDate.toLocaleDateString(
                                "it-IT",
                              )}`
                            : "Nessuna scadenza"}
                        </span>

                        <span className="text-sm font-semibold text-slate-500 transition group-open:rotate-180">
                          â†“
                        </span>
                      </div>
                    </div>
                  }
                  fields={
                    <DocumentFields
                      document={document}
                    />
                  }
attachment={
  <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      {document.fileUrl ? (
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-blue-700 transition hover:text-blue-900"
        >
          Apri file allegato
        </a>
      ) : (
        <span className="text-sm text-slate-500">
          Nessun file allegato
        </span>
      )}

      {document.fileUrl ? (
        <>
          <input
            type="hidden"
            name="propertyId"
            value={propertyId}
          />

          <input
            type="hidden"
            name="documentId"
            value={document.id}
          />

          <button
  type="submit"
  formAction={retryOcrAction}
  disabled={
              document.ocrStatus === "QUEUED" ||
              document.ocrStatus === "PROCESSING"
            }
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {document.ocrStatus === "QUEUED"
              ? "OCR in coda"
              : document.ocrStatus === "PROCESSING"
                ? "OCR in corso"
                : "Riprova OCR"}
          </button>
        </>
      ) : null}
    </div>

    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <DocumentBadge
          label={getOcrStatusLabel(
            document.ocrStatus,
          )}
          className={getOcrStatusClassName(
            document.ocrStatus,
          )}
        />

        {document.ocrProvider ? (
          <span className="text-xs text-slate-500">
            Provider: {document.ocrProvider}
          </span>
        ) : null}

        {document.ocrProviderVersion ? (
  <span className="text-xs text-slate-500">
    Versione: {document.ocrProviderVersion}
  </span>
) : null}

        {document.ocrRequestedAt ? (
  <span className="text-xs text-slate-500">
    Richiesto:{" "}
    {formatDateTime(
      document.ocrRequestedAt,
    )}
  </span>
) : null}

{document.ocrStartedAt ? (
  <span className="text-xs text-slate-500">
    Iniziato:{" "}
    {formatDateTime(
      document.ocrStartedAt,
    )}
  </span>
) : null}

        {document.ocrCompletedAt ? (
          <span className="text-xs text-slate-500">
            Completato:{" "}
            {formatDateTime(
              document.ocrCompletedAt,
            )}
          </span>
        ) : null}
      </div>

     {document.ocrStartedAt &&
document.ocrCompletedAt ? (
  <span className="text-xs text-slate-500">
    Durata:{" "}
    {formatOcrDuration(
      document.ocrStartedAt,
      document.ocrCompletedAt,
    )}{" "}
    s
  </span>
) : null}

      {document.ocrStatus === "QUEUED" ? (
        <p className="mt-3 text-sm text-slate-600">
          Il documento è in coda per
          l&apos;elaborazione OCR.
        </p>
      ) : null}

      {document.ocrStatus === "PROCESSING" ? (
        <p className="mt-3 text-sm text-slate-600">
          Elaborazione OCR in corso...
        </p>
      ) : null}

      {document.ocrStatus === "NOT_REQUESTED" ? (
        <p className="mt-3 text-sm text-slate-600">
          Nessuna elaborazione OCR disponibile.
        </p>
      ) : null}

      {document.ocrStatus ===
      "REVIEW_REQUIRED" ? (
        <p className="mt-3 text-sm text-amber-700">
          L&apos;estrazione è terminata ma richiede
          una verifica manuale.
        </p>
      ) : null}

      {document.ocrError ? (
        <p className="mt-3 text-sm text-red-700">
          {document.ocrError}
        </p>
      ) : null}

      {document.ocrExtractedText ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Testo OCR
          </p>

          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
            {document.ocrExtractedText}
          </pre>
        </div>
      ) : null}
    </div>
  </div>
}
                  deleteForm={
                    <form
                      action={deleteAction}
                      className="mt-4 flex justify-end"
                    >
                      <input
                        type="hidden"
                        name="propertyId"
                        value={propertyId}
                      />

                      <input
                        type="hidden"
                        name="documentId"
                        value={document.id}
                      />

                      <button
                        type="submit"
                        className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                      >
                        Elimina documento
                      </button>
                    </form>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DocumentFields({
  document,
}: {
  document?: PropertyDocumentWorkspaceData;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <label
          htmlFor={
            document
              ? `type-${document.id}`
              : "new-document-type"
          }
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Tipo documento
        </label>

        <select
          id={
            document
              ? `type-${document.id}`
              : "new-document-type"
          }
          name="type"
          required
          defaultValue={document?.type ?? "OTHER"}
          className={inputClassName}
        >
          {documentTypes.map((type) => (
            <option
              key={type.value}
              value={type.value}
            >
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={
            document
              ? `validity-${document.id}`
              : "new-document-validity"
          }
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Stato validitÃ 
        </label>

        <select
          id={
            document
              ? `validity-${document.id}`
              : "new-document-validity"
          }
          name="validity"
          required
          defaultValue={document?.validity ?? "VALID"}
          className={inputClassName}
        >
          {validityOptions.map((validity) => (
            <option
              key={validity.value}
              value={validity.value}
            >
              {validity.label}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor={
            document
              ? `title-${document.id}`
              : "new-document-title"
          }
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Titolo
        </label>

        <input
          id={
            document
              ? `title-${document.id}`
              : "new-document-title"
          }
          name="title"
          type="text"
          required
          defaultValue={document?.title ?? ""}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor={
            document
              ? `documentNumber-${document.id}`
              : "new-document-number"
          }
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Numero documento
        </label>

        <input
          id={
            document
              ? `documentNumber-${document.id}`
              : "new-document-number"
          }
          name="documentNumber"
          type="text"
          defaultValue={document?.documentNumber ?? ""}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor={
            document
              ? `issuer-${document.id}`
              : "new-document-issuer"
          }
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Ente rilasciante
        </label>

        <input
          id={
            document
              ? `issuer-${document.id}`
              : "new-document-issuer"
          }
          name="issuer"
          type="text"
          defaultValue={document?.issuer ?? ""}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor={
            document
              ? `issueDate-${document.id}`
              : "new-document-issue-date"
          }
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Data rilascio
        </label>

        <input
          id={
            document
              ? `issueDate-${document.id}`
              : "new-document-issue-date"
          }
          name="issueDate"
          type="date"
          defaultValue={formatDateInput(
            document?.issueDate,
          )}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor={
            document
              ? `expiryDate-${document.id}`
              : "new-document-expiry-date"
          }
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Data scadenza
        </label>

        <input
          id={
            document
              ? `expiryDate-${document.id}`
              : "new-document-expiry-date"
          }
          name="expiryDate"
          type="date"
          defaultValue={formatDateInput(
            document?.expiryDate,
          )}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor={
            document
              ? `fileUrl-${document.id}`
              : "new-document-file-url"
          }
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          URL file
        </label>

        <input
          id={
            document
              ? `fileUrl-${document.id}`
              : "new-document-file-url"
          }
          name="fileUrl"
          type="url"
          defaultValue={document?.fileUrl ?? ""}
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor={
            document
              ? `filename-${document.id}`
              : "new-document-filename"
          }
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Nome file
        </label>

        <input
          id={
            document
              ? `filename-${document.id}`
              : "new-document-filename"
          }
          name="filename"
          type="text"
          defaultValue={document?.filename ?? ""}
          className={inputClassName}
        />
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor={
            document
              ? `notes-${document.id}`
              : "new-document-notes"
          }
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Note
        </label>

        <textarea
          id={
            document
              ? `notes-${document.id}`
              : "new-document-notes"
          }
          name="notes"
          rows={4}
          defaultValue={document?.notes ?? ""}
          className={`${inputClassName} resize-y`}
        />
      </div>
    </div>
  );
}

function DocumentBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function formatDateInput(date?: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function getDocumentTypeLabel(
  type: PropertyDocumentType,
) {
  return (
    documentTypes.find(
      (documentType) =>
        documentType.value === type,
    )?.label ?? type.replaceAll("_", " ")
  );
}

function getValidityLabel(
  validity: PropertyDocumentValidity,
) {
  return (
    validityOptions.find(
      (option) => option.value === validity,
    )?.label ?? validity
  );
}

function getValidityClassName(
  validity: PropertyDocumentValidity,
) {
  switch (validity) {
    case "VALID":
      return "bg-emerald-100 text-emerald-700";

    case "EXPIRING":
      return "bg-amber-100 text-amber-700";

    case "EXPIRED":
      return "bg-red-100 text-red-700";
  }
}

function getOcrStatusLabel(
  status: PropertyDocumentWorkspaceData["ocrStatus"],
) {
  switch (status) {
    case "NOT_REQUESTED":
      return "OCR non richiesto";

    case "QUEUED":
      return "OCR in coda";

    case "PROCESSING":
      return "OCR in elaborazione";

    case "COMPLETED":
      return "OCR completato";

    case "REVIEW_REQUIRED":
      return "Da verificare";

    case "FAILED":
      return "OCR fallito";
  }
}

function getOcrStatusClassName(
  status: PropertyDocumentWorkspaceData["ocrStatus"],
) {
  switch (status) {
    case "NOT_REQUESTED":
      return "bg-slate-100 text-slate-700";

    case "QUEUED":
      return "bg-sky-100 text-sky-700";

    case "PROCESSING":
      return "bg-blue-100 text-blue-700";

    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";

    case "REVIEW_REQUIRED":
      return "bg-amber-100 text-amber-700";

    case "FAILED":
      return "bg-red-100 text-red-700";
  }
}

function formatDateTime(
  date: Date | null,
) {
  if (!date) {
    return null;
  }

  return date.toLocaleString("it-IT");
}

function formatOcrDuration(
  startedAt: Date | null,
  completedAt: Date | null,
) {
  if (!startedAt || !completedAt) {
    return null;
  }

  return (
    Math.max(
      0,
      completedAt.getTime() - startedAt.getTime(),
    ) / 1000
  ).toLocaleString("it-IT", {
    maximumFractionDigits: 1,
  });
}

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10";

