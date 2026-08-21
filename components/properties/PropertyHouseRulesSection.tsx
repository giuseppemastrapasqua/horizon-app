import {
  PROPERTY_HOUSE_RULE_CATEGORY_LABELS,
  type PropertyHouseRuleCategory,
} from "@/lib/properties/property-house-rules";

type HouseRule = {
  id: string;
  key: string;
  label: string;
  category: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

type PropertyHouseRulesSectionProps = {
  propertyId: string;
  houseRules: HouseRule[];
  selectedHouseRuleIds: string[];
  updateAction: (formData: FormData) => Promise<void>;
};

function getCategoryLabel(category: string): string {
  if (category in PROPERTY_HOUSE_RULE_CATEGORY_LABELS) {
    return PROPERTY_HOUSE_RULE_CATEGORY_LABELS[
      category as PropertyHouseRuleCategory
    ];
  }

  return category
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export function PropertyHouseRulesSection({
  propertyId,
  houseRules,
  selectedHouseRuleIds,
  updateAction,
}: PropertyHouseRulesSectionProps) {
  const selectedIds = new Set(selectedHouseRuleIds);

  const activeHouseRules = houseRules.filter(
    (houseRule) => houseRule.isActive,
  );

  const groupedHouseRules = activeHouseRules.reduce<
    Map<string, HouseRule[]>
  >((groups, houseRule) => {
    const categoryHouseRules =
      groups.get(houseRule.category) ?? [];

    categoryHouseRules.push(houseRule);
    groups.set(houseRule.category, categoryHouseRules);

    return groups;
  }, new Map());

  return (
    <section
      id="regole-della-casa"
      className="scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white">
            04
          </span>

          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Regole della casa
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Definisci le regole operative e comportamentali
              dell&apos;immobile.
            </p>
          </div>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          {selectedHouseRuleIds.length} selezionate
        </span>
      </div>

      {activeHouseRules.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
          <p className="font-medium text-slate-800">
            Nessuna regola disponibile
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Il catalogo delle regole non contiene elementi
            attivi.
          </p>
        </div>
      ) : (
        <form
          action={updateAction}
          className="space-y-8"
        >
          <input
            type="hidden"
            name="propertyId"
            value={propertyId}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from(groupedHouseRules.entries()).map(
              ([category, categoryHouseRules]) => (
                <fieldset
                  key={category}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-slate-700">
                    {getCategoryLabel(category)}
                  </legend>

                  <div className="mt-2 grid gap-3">
                    {categoryHouseRules.map(
                      (houseRule) => (
                        <label
                          key={houseRule.id}
                          className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:shadow-sm"
                        >
                          <input
                            type="checkbox"
                            name="houseRuleIds"
                            value={houseRule.id}
                            defaultChecked={selectedIds.has(
                              houseRule.id,
                            )}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-slate-950 focus:ring-blue-500"
                          />

                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-slate-900">
                              {houseRule.label}
                            </span>

                            {houseRule.description ? (
                              <span className="mt-1 block text-xs leading-5 text-slate-500">
                                {houseRule.description}
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ),
                    )}
                  </div>
                </fieldset>
              ),
            )}
          </div>

          <div className="flex justify-end border-t border-slate-200 pt-6">
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Salva regole
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
