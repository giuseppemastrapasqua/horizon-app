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
        className="h-11 rounded-xl border border-white/[0.08] bg-[#09131C] px-4 text-sm text-[#E8E1D5] outline-none [color-scheme:dark] transition focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
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
