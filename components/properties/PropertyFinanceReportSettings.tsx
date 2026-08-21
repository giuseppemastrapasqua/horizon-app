type FinanceReportTemplateSettings = {
  name: string;
  headerTitle: string;
  primaryColor: string;
  logoUrl: string | null;
  showBookingDetails: boolean;
  showOtaCommissions: boolean;
  showCleaningCosts: boolean;
  showManagementFees: boolean;
  showTaxes: boolean;
  showManualAdjustments: boolean;
  showCategorySummary: boolean;
  footerText: string | null;
};

type Props = {
  propertyId: string;
  template: FinanceReportTemplateSettings;
  isCustomized: boolean;
  updateAction: (formData: FormData) => Promise<void>;
  resetAction: (formData: FormData) => Promise<void>;
};

export function PropertyFinanceReportSettings({
  propertyId,
  template,
  isCustomized,
  updateAction,
  resetAction,
}: Props) {
  return (
    <section
      id="rendiconto-proprietario"
      className="scroll-mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 px-8 py-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">
              Finance
            </div>

            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Rendiconto proprietario
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Personalizza il documento senza modificare i calcoli finanziari.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {isCustomized
              ? "Template personalizzato"
              : "Horizon Default"}
          </span>
        </div>
      </div>

      <form
        action={updateAction}
        className="space-y-8 p-8"
      >
        <input
          type="hidden"
          name="propertyId"
          value={propertyId}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Nome configurazione"
            name="name"
            defaultValue={template.name}
          />

          <Field
            label="Titolo rendiconto"
            name="headerTitle"
            defaultValue={template.headerTitle}
          />

          <Field
            label="Logo URL"
            name="logoUrl"
            defaultValue={template.logoUrl ?? ""}
            required={false}
          />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Colore principale
            </span>

            <input
              type="color"
              name="primaryColor"
              defaultValue={template.primaryColor}
              className="h-12 w-20 rounded-xl border border-slate-300 bg-white p-1"
            />
          </label>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Contenuti del PDF
          </h3>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Toggle
              name="showBookingDetails"
              label="Dettaglio prenotazioni"
              checked={template.showBookingDetails}
            />

            <Toggle
              name="showOtaCommissions"
              label="Commissioni OTA"
              checked={template.showOtaCommissions}
            />

            <Toggle
              name="showCleaningCosts"
              label="Costi pulizie"
              checked={template.showCleaningCosts}
            />

            <Toggle
              name="showManagementFees"
              label="Commissione PM"
              checked={template.showManagementFees}
            />

            <Toggle
              name="showTaxes"
              label="Imposte"
              checked={template.showTaxes}
            />

            <Toggle
              name="showManualAdjustments"
              label="Spese e rettifiche"
              checked={template.showManualAdjustments}
            />

            <Toggle
              name="showCategorySummary"
              label="Riepilogo categorie"
              checked={template.showCategorySummary}
            />
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700">
            Footer
          </span>

          <textarea
            name="footerText"
            rows={3}
            defaultValue={template.footerText ?? ""}
            className="w-full rounded-xl border border-slate-300 px-4 py-3"
          />
        </label>

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
        >
          Salva personalizzazione
        </button>
      </form>

      {isCustomized ? (
        <form
          action={resetAction}
          className="border-t border-slate-100 bg-slate-50 px-8 py-5"
        >
          <input
            type="hidden"
            name="propertyId"
            value={propertyId}
          />

          <button
            type="submit"
            className="text-sm font-semibold text-slate-600"
          >
            Ripristina Horizon Default
          </button>
        </form>
      ) : null}
    </section>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required = true,
}: {
  label: string;
  name: string;
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type="text"
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
      />
    </label>
  );
}

function Toggle({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
      />

      <span className="text-sm font-medium text-slate-700">
        {label}
      </span>
    </label>
  );
}
