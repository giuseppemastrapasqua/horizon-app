type PropertySearchFormProps = {
  defaultValue?: string;
};

export function PropertySearchForm({
  defaultValue = "",
}: PropertySearchFormProps) {
  return (
    <div className="flex w-full max-w-xl items-center gap-3">
      <div className="flex-1">
        <label htmlFor="search" className="sr-only">
          Cerca immobili
        </label>

        <input
          id="search"
          name="search"
          type="search"
          defaultValue={defaultValue}
          placeholder="Cerca per nome, indirizzo, città o zona..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
        />
      </div>

      <button
        type="submit"
        className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
      >
        Cerca
      </button>
    </div>
  );
}