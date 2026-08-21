import type {
  PropertyChannelPricingSetting,
} from "@/lib/pricing/get-property-channel-pricing-settings";

type PropertyChannelPricingSettingsProps = {
  propertyId:
    string;

  settings:
    PropertyChannelPricingSetting[];

  updateAction:
    (
      formData:
        FormData,
    ) => Promise<void>;
};

const LABELS = {
  BOOKING:
    "Booking.com",

  AIRBNB:
    "Airbnb",

  VRBO:
    "Vrbo",
} as const;

export function PropertyChannelPricingSettings({
  propertyId,
  settings,
  updateAction,
}: PropertyChannelPricingSettingsProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Configurazione economica
        </p>

        <h2 className="mt-2 text-xl font-semibold text-slate-950">
          Commissioni OTA della struttura
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Inserisci la percentuale applicata da ciascun canale.
          Questi valori sono specifici della struttura e vengono
          utilizzati nei rendiconti finanziari.
        </p>
      </div>

      <div className="grid gap-4 p-8 lg:grid-cols-3">
        {settings.map(
          (setting) => (
            <form
              key={
                setting.channel
              }
              action={
                updateAction
              }
              className="rounded-2xl border border-slate-200 p-5"
            >
              <input
                type="hidden"
                name="propertyId"
                value={
                  propertyId
                }
              />

              <input
                type="hidden"
                name="channel"
                value={
                  setting.channel
                }
              />

              <h3 className="font-semibold text-slate-950">
                {
                  LABELS[
                    setting.channel
                  ]
                }
              </h3>

              <label className="mt-5 block text-sm font-medium text-slate-700">
                Commissione OTA %
              </label>

              <input
                type="number"
                name="commissionPercent"
                min="0"
                max="99.99"
                step="0.01"
                required
                defaultValue={
                  setting.commissionPercent ??
                  ""
                }
                placeholder="Es. 18"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
              />

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Percentuale già comprensiva di IVA.
              </p>

              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Salva commissione
              </button>
            </form>
          ),
        )}
      </div>
    </section>
  );
}
