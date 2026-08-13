type VerificationStatus =
  | "NOT_VERIFIED"
  | "PENDING"
  | "VERIFIED"
  | "NOT_FOUND"
  | "MISMATCH"
  | "REVIEW_REQUIRED";

type PropertyCodeVerificationHistoryItem = {
  id: string;
  provider: string;
  cin: string;
  cir: string;
  status: VerificationStatus;
  notes: string | null;
  createdAt: Date;
};

type PropertyCodeVerificationHistoryProps = {
  verifications: PropertyCodeVerificationHistoryItem[];
};

const STATUS_CONFIG: Record<
  VerificationStatus,
  {
    label: string;
    badgeClassName: string;
    dotClassName: string;
  }
> = {
  NOT_VERIFIED: {
    label: "Non verificato",
    badgeClassName:
      "bg-slate-100 text-slate-700 ring-slate-200",
    dotClassName: "bg-slate-400",
  },

  PENDING: {
    label: "In corso",
    badgeClassName:
      "bg-amber-100 text-amber-700 ring-amber-200",
    dotClassName: "bg-amber-500",
  },

  VERIFIED: {
    label: "Verificato",
    badgeClassName:
      "bg-emerald-100 text-emerald-700 ring-emerald-200",
    dotClassName: "bg-emerald-500",
  },

  NOT_FOUND: {
    label: "Non trovato",
    badgeClassName:
      "bg-red-100 text-red-700 ring-red-200",
    dotClassName: "bg-red-500",
  },

  MISMATCH: {
    label: "Dati non coerenti",
    badgeClassName:
      "bg-orange-100 text-orange-700 ring-orange-200",
    dotClassName: "bg-orange-500",
  },

  REVIEW_REQUIRED: {
    label: "Revisione richiesta",
    badgeClassName:
      "bg-violet-100 text-violet-700 ring-violet-200",
    dotClassName: "bg-violet-500",
  },
};

function formatProvider(provider: string) {
  if (provider === "UNCONFIGURED") {
    return "Provider non configurato";
  }

  return provider
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export function PropertyCodeVerificationHistory({
  verifications,
}: PropertyCodeVerificationHistoryProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            Storico delle verifiche
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Consulta gli ultimi tentativi di controllo effettuati
            sui codici identificativi dell&apos;immobile.
          </p>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
          {verifications.length}{" "}
          {verifications.length === 1
            ? "verifica"
            : "verifiche"}
        </span>
      </div>

      {verifications.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Nessuna verifica effettuata
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Lo storico verrà popolato dopo la prima richiesta di
            verifica del CIN e del CIR.
          </p>
        </div>
      ) : (
        <ol className="mt-8 space-y-0">
          {verifications.map((verification, index) => {
            const status =
              STATUS_CONFIG[verification.status];

            const isLast =
              index === verifications.length - 1;

            return (
              <li
                key={verification.id}
                className="relative grid grid-cols-[24px_1fr] gap-4"
              >
                <div className="flex flex-col items-center">
                  <span
                    className={`mt-2 h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${status.dotClassName}`}
                  />

                  {!isLast && (
                    <span className="mt-2 h-full w-px bg-slate-200" />
                  )}
                </div>

                <article
                  className={`min-w-0 ${
                    isLast ? "pb-0" : "pb-8"
                  }`}
                >
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatProvider(
                            verification.provider,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {new Intl.DateTimeFormat("it-IT", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(
                            new Date(
                              verification.createdAt,
                            ),
                          )}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${status.badgeClassName}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          CIN
                        </dt>

                        <dd className="mt-2 break-all font-mono text-sm font-semibold text-slate-900">
                          {verification.cin}
                        </dd>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          CIR
                        </dt>

                        <dd className="mt-2 break-all font-mono text-sm font-semibold text-slate-900">
                          {verification.cir}
                        </dd>
                      </div>
                    </dl>

                    {verification.notes && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Note
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {verification.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}