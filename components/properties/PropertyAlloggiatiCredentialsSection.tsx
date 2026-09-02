type PropertyAlloggiatiCredentialsSectionProps = {
  propertyId: string;
  configured: boolean;
  updatedAt: Date | null;
  saveAction: (
    formData: FormData,
  ) => Promise<void>;
};

export function PropertyAlloggiatiCredentialsSection({
  propertyId,
  configured,
  updatedAt,
  saveAction,
}: PropertyAlloggiatiCredentialsSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Compliance
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-950">
            Alloggiati Web
          </h2>

          <span
            className={
              configured
                ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
            }
          >
            {configured
              ? "Credenziali configurate"
              : "Da configurare"}
          </span>
        </div>

        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Le credenziali vengono cifrate prima del
          salvataggio e non vengono mai mostrate
          nuovamente.
        </p>

        {configured && updatedAt ? (
          <p className="mt-2 text-xs text-slate-500">
            Ultimo aggiornamento:{" "}
            {updatedAt.toLocaleString("it-IT")}
          </p>
        ) : null}
      </div>

      <form
        action={saveAction}
        className="grid gap-4 md:grid-cols-3"
      >
        <input
          type="hidden"
          name="propertyId"
          value={propertyId}
        />

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Username
          <input
            name="username"
            type="text"
            autoComplete="off"
            required
            className="rounded-xl border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-500"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="rounded-xl border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-500"
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          WSKEY
          <input
            name="wsKey"
            type="password"
            autoComplete="off"
            required
            className="rounded-xl border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-slate-500"
          />
        </label>

        <div className="md:col-span-3">
          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {configured
              ? "Sostituisci credenziali"
              : "Salva credenziali"}
          </button>
        </div>
      </form>
    </section>
  );
}
