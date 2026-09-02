"use client";

import {
  useRef,
  useState,
  useTransition,
} from "react";

type AlloggiatiAccountOption = {
  id: string;
  name: string;
};

type AlloggiatiApartmentOption = {
  apartmentId: string;
  description: string;
};

type AlloggiatiConnection = {
  accountName: string;
  apartmentId: string;
  updatedAt: Date;
} | null;

type PropertyAlloggiatiCredentialsSectionProps = {
  propertyId: string;
  connection: AlloggiatiConnection;
  accounts: AlloggiatiAccountOption[];
  createAccountAction: (
    formData: FormData,
  ) => Promise<void>;
  linkAccountAction: (
    formData: FormData,
  ) => Promise<void>;
  listApartmentsAction: (
    propertyId: string,
    accountId: string,
  ) => Promise<AlloggiatiApartmentOption[]>;
  discoverApartmentsAction: (
    formData: FormData,
  ) => Promise<AlloggiatiApartmentOption[]>;
};

export function PropertyAlloggiatiCredentialsSection({
  propertyId,
  connection,
  accounts,
  createAccountAction,
  linkAccountAction,
  listApartmentsAction,
  discoverApartmentsAction,
}: PropertyAlloggiatiCredentialsSectionProps) {
  const newAccountFormRef =
    useRef<HTMLFormElement>(null);

  const [accountId, setAccountId] =
    useState("");

  const [apartments, setApartments] =
    useState<AlloggiatiApartmentOption[]>([]);

  const [loadError, setLoadError] =
    useState<string | null>(null);

  const [
    discoveredApartments,
    setDiscoveredApartments,
  ] = useState<AlloggiatiApartmentOption[]>([]);

  const [
    discoveryError,
    setDiscoveryError,
  ] = useState<string | null>(null);

  const [isLoading, startTransition] =
    useTransition();

  const [
    isDiscovering,
    startDiscoveryTransition,
  ] = useTransition();

  function loadApartments() {
    if (!accountId) {
      setApartments([]);
      setLoadError(
        "Seleziona prima un account Alloggiati Web.",
      );
      return;
    }

    setLoadError(null);
    setApartments([]);

    startTransition(async () => {
      try {
        const result =
          await listApartmentsAction(
            propertyId,
            accountId,
          );

        setApartments(result);

        if (result.length === 0) {
          setLoadError(
            "Nessuna struttura restituita da Alloggiati Web.",
          );
        }
      } catch (error) {
        setLoadError(
          getErrorMessage(error),
        );
      }
    });
  }

  function discoverApartments() {
    const form =
      newAccountFormRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);

    setDiscoveryError(null);
    setDiscoveredApartments([]);

    startDiscoveryTransition(async () => {
      try {
        const result =
          await discoverApartmentsAction(
            formData,
          );

        setDiscoveredApartments(result);

        if (result.length === 0) {
          setDiscoveryError(
            "Nessuna struttura restituita da Alloggiati Web.",
          );
        }
      } catch (error) {
        setDiscoveryError(
          getErrorMessage(error),
        );
      }
    });
  }

  if (connection) {
    return (
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-8 py-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Compliance
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-950">
              Alloggiati Web
            </h2>

            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
              Collegato
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            La struttura utilizza un account Alloggiati Web
            configurato in Horizon.
          </p>
        </div>

        <div className="grid gap-4 p-8 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Account
            </p>
            <p className="mt-2 font-semibold text-slate-950">
              {connection.accountName}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              IdAppartamento
            </p>
            <p className="mt-2 font-semibold text-slate-950">
              {connection.apartmentId}
            </p>
          </div>

          <p className="text-xs text-slate-500 md:col-span-2">
            Credenziali cifrate e non visualizzabili.
            Ultimo aggiornamento:{" "}
            {connection.updatedAt.toLocaleString("it-IT")}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-8 py-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Compliance
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-semibold text-slate-950">
            Alloggiati Web
          </h2>

          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
            Da configurare
          </span>
        </div>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Collega un account esistente oppure configura
          nuove credenziali. Horizon recupera direttamente
          le strutture disponibili da Alloggiati Web.
        </p>
      </div>

      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-950">
            Usa account esistente
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Seleziona l&apos;account e recupera direttamente
            le strutture disponibili da Alloggiati Web.
          </p>

          {accounts.length > 0 ? (
            <form
              action={linkAccountAction}
              className="mt-6 grid gap-4"
            >
              <input
                type="hidden"
                name="propertyId"
                value={propertyId}
              />

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Account
                <select
                  name="accountId"
                  required
                  value={accountId}
                  onChange={(event) => {
                    setAccountId(
                      event.target.value,
                    );
                    setApartments([]);
                    setLoadError(null);
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
                >
                  <option value="" disabled>
                    Seleziona account
                  </option>

                  {accounts.map((account) => (
                    <option
                      key={account.id}
                      value={account.id}
                    >
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={loadApartments}
                disabled={!accountId || isLoading}
                className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading
                  ? "Caricamento..."
                  : "Carica strutture"}
              </button>

              {loadError ? (
                <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                  {loadError}
                </p>
              ) : null}

              {apartments.length > 0 ? (
                <>
                  <ApartmentSelect
                    apartments={apartments}
                  />

                  <button
                    type="submit"
                    className="mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Collega struttura
                  </button>
                </>
              ) : null}
            </form>
          ) : (
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Nessun account Alloggiati Web disponibile.
              Configurane uno nuovo.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-950">
            Configura nuovo account
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Inserisci le credenziali e carica le strutture.
            Le credenziali vengono salvate solo quando
            confermi il collegamento.
          </p>

          <form
            ref={newAccountFormRef}
            action={createAccountAction}
            className="mt-6 grid gap-4"
          >
            <input
              type="hidden"
              name="propertyId"
              value={propertyId}
            />

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Nome account
              <input
                name="accountName"
                type="text"
                required
                placeholder="Es. Account Alloggiati Milano"
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Username
              <input
                name="username"
                type="text"
                autoComplete="off"
                required
                onChange={() => {
                  setDiscoveredApartments([]);
                  setDiscoveryError(null);
                }}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                onChange={() => {
                  setDiscoveredApartments([]);
                  setDiscoveryError(null);
                }}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              WSKEY
              <input
                name="wsKey"
                type="password"
                autoComplete="off"
                required
                onChange={() => {
                  setDiscoveredApartments([]);
                  setDiscoveryError(null);
                }}
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
              />
            </label>

            <button
              type="button"
              onClick={discoverApartments}
              disabled={isDiscovering}
              className="rounded-xl border border-slate-300 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDiscovering
                ? "Caricamento..."
                : "Carica strutture"}
            </button>

            {discoveryError ? (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                {discoveryError}
              </p>
            ) : null}

            {discoveredApartments.length > 0 ? (
              <>
                <ApartmentSelect
                  apartments={
                    discoveredApartments
                  }
                />

                <button
                  type="submit"
                  className="mt-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Crea account e collega
                </button>
              </>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}

function ApartmentSelect({
  apartments,
}: {
  apartments: AlloggiatiApartmentOption[];
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      Struttura Alloggiati Web
      <select
        name="apartmentId"
        required
        defaultValue=""
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
      >
        <option value="" disabled>
          Seleziona struttura
        </option>

        {apartments.map((apartment) => (
          <option
            key={apartment.apartmentId}
            value={apartment.apartmentId}
          >
            {apartment.description} (
            {apartment.apartmentId})
          </option>
        ))}
      </select>
    </label>
  );
}

function getErrorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : "Impossibile caricare le strutture Alloggiati Web.";
}