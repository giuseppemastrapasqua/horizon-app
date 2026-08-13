import type { PropertySortOption } from "@/lib/properties/get-properties-page-data";

type PropertySortSelectProps = {
  defaultValue?: PropertySortOption;
};

const options: {
  value: PropertySortOption;
  label: string;
}[] = [
  {
    value: "newest",
    label: "Più recenti",
  },
  {
    value: "oldest",
    label: "Meno recenti",
  },
  {
    value: "name-asc",
    label: "Nome (A-Z)",
  },
  {
    value: "name-desc",
    label: "Nome (Z-A)",
  },
  {
    value: "score-desc",
    label: "Score più alto",
  },
];

export function PropertySortSelect({
  defaultValue = "newest",
}: PropertySortSelectProps) {
  return (
    <div>
      <label
        htmlFor="sort"
        className="sr-only"
      >
        Ordina immobili
      </label>

      <select
        id="sort"
        name="sort"
        defaultValue={defaultValue}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}