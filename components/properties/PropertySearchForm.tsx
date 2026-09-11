type PropertySearchFormProps = {
  defaultValue?: string;
};

export function PropertySearchForm({
  defaultValue = "",
}: PropertySearchFormProps) {
  return (
    <div className="flex w-full items-center gap-2">
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
          className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#09131C] px-4 text-sm text-[#F4EEDF] outline-none transition placeholder:text-[#526472] focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
        />
      </div>

      <button
        type="submit"
        className="h-11 rounded-xl border border-[#D8B367]/35 bg-[#0C1822] px-5 text-sm font-semibold text-[#D8B367] transition hover:border-[#D8B367]/60 hover:bg-[#D8B367]/[0.06]"
      >
        Cerca
      </button>
    </div>
  );
}
