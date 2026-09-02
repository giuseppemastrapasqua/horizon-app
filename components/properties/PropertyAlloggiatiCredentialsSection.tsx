type AlloggiatiAccountOption = {
  id: string;
  name: string;
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
};

export function PropertyAlloggiatiCredentialsSection({
  propertyId,
  connection,
  accounts,
  createAccountAction,
  linkAccountAction,
}: PropertyAlloggiatiCredentialsSectionProps) {
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
          nuove credenziali. Le credenziali vengono cifrate
          e non vengono mostrate nuovamente.
        </p>
      </div>

      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-950">
            Usa account esistente
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Riutilizza un account già configurato senza
            reinserire username, password e WSKEY.
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
                  defaultValue=""
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

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                IdAppartamento
                <input
                  name="apartmentId"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]+"
                  required
                  className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
                />
              </label>

              <button
                type="submit"
                className="mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Collega struttura
              </button>
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
            Inserisci le credenziali una sola volta. Potrai
            riutilizzare questo account per altre strutture.
          </p>

          <form
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
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              IdAppartamento
              <input
                name="apartmentId"
                type="text"
                inputMode="numeric"
                pattern="[0-9]+"
                required
                className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
              />
            </label>

            <button
              type="submit"
              className="mt-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Crea account e collega
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}