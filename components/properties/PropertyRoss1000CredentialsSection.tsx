import Link from "next/link";

type Ross1000AccountOption = {
  id: string;
  name: string;
};

type Ross1000Connection = {
  accountName: string;
  structureCode: string;
  roomsAvailable: number;
  bedsAvailable: number;
  updatedAt: Date;
} | null;

type PropertyRoss1000CredentialsSectionProps = {
  propertyId: string;
  connection: Ross1000Connection;
  accounts: Ross1000AccountOption[];
  createAccountAction: (
    formData: FormData,
  ) => Promise<void>;
  linkAccountAction: (
    formData: FormData,
  ) => Promise<void>;
};

export function PropertyRoss1000CredentialsSection({
  propertyId,
  connection,
  accounts,
  createAccountAction,
  linkAccountAction,
}: PropertyRoss1000CredentialsSectionProps) {
  if (connection) {
    return (
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-8 py-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Compliance
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-950">
              ROSS1000
            </h2>

            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
              Collegato
            </span>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Collegamento statistico regionale configurato per
            questa struttura.
          </p>
        </div>

        <div className="px-8 pt-5"><Link className="text-sm font-semibold text-blue-700" href={`/properties/${propertyId}/ross1000`}>Prepara e controlla i movimenti giornalieri →</Link></div>
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
              Codice struttura
            </p>
            <p className="mt-2 font-semibold text-slate-950">
              {connection.structureCode}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Camere / unità disponibili
            </p>
            <p className="mt-2 font-semibold text-slate-950">
              {connection.roomsAvailable}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Letti disponibili
            </p>
            <p className="mt-2 font-semibold text-slate-950">
              {connection.bedsAvailable}
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
            ROSS1000
          </h2>

          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
            Da configurare
          </span>
        </div>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Configura il collegamento ROSS1000 per i flussi
          statistici regionali. Nessun dato viene trasmesso
          durante questa configurazione.
        </p>
      </div>

      <div className="grid gap-6 p-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-950">
            Usa account esistente
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Collega uno degli account ROSS1000 già configurati
            per lo stesso proprietario.
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

              <StructureCodeInput />
              <CapacityInputs />

              <button
                type="submit"
                className="mt-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Collega struttura
              </button>
            </form>
          ) : (
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Nessun account ROSS1000 disponibile.
              Configurane uno nuovo.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-950">
            Configura nuovo account
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Le credenziali vengono cifrate prima della
            persistenza e non saranno visualizzabili dalla UI.
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
                placeholder="Es. ROSS1000 Lombardia"
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

            <StructureCodeInput />
            <CapacityInputs />

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

function StructureCodeInput() {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      Codice struttura ROSS1000
      <input
        name="structureCode"
        type="text"
        required
        autoComplete="off"
        placeholder="Codice assegnato alla struttura"
        className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
      />
    </label>
  );
}

function CapacityInputs() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Camere / unità disponibili
        <input
          name="roomsAvailable"
          type="number"
          min="0"
          step="1"
          required
          inputMode="numeric"
          placeholder="Es. 1"
          className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Letti disponibili
        <input
          name="bedsAvailable"
          type="number"
          min="0"
          step="1"
          required
          inputMode="numeric"
          placeholder="Es. 4"
          className="rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600"
        />
      </label>
    </div>
  );
}
