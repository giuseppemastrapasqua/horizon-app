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
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
        />
      </div>

      <button
        type="submit"
        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Cerca
      </button>
    </div>
  );
}
