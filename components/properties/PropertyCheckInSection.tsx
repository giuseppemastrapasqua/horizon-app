import {
  PROPERTY_CHECK_IN_TYPES,
  PROPERTY_CHECK_IN_TYPE_LABELS,
  type PropertyCheckInConfigurationData,
} from "@/lib/properties/property-check-in";

type PropertyCheckInSectionProps = {
  propertyId: string;
  checkInConfiguration:
    | PropertyCheckInConfigurationData
    | null;
  updateAction: (formData: FormData) => Promise<void>;
};

export function PropertyCheckInSection({
  propertyId,
  checkInConfiguration,
  updateAction,
}: PropertyCheckInSectionProps) {
  return (
    <section
      id="check-in"
      className="scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">
            05
          </span>

          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Check-in
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Configura modalità di accesso, istruzioni e
              contatti operativi per gli ospiti.
            </p>
          </div>
        </div>

        <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          {checkInConfiguration
            ? "Configurato"
            : "Da configurare"}
        </span>
      </div>

      <form action={updateAction} className="space-y-8">
        <input
          type="hidden"
          name="propertyId"
          value={propertyId}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <label
              htmlFor="checkInType"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Modalità di check-in
            </label>

            <select
              id="checkInType"
              name="checkInType"
              defaultValue={
                checkInConfiguration?.checkInType ?? ""
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            >
              <option value="">
                Seleziona una modalità
              </option>

              {PROPERTY_CHECK_IN_TYPES.map(
                (checkInType) => (
                  <option
                    key={checkInType}
                    value={checkInType}
                  >
                    {
                      PROPERTY_CHECK_IN_TYPE_LABELS[
                        checkInType
                      ]
                    }
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="arrivalInstructions"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Istruzioni di arrivo
            </label>

            <textarea
              id="arrivalInstructions"
              name="arrivalInstructions"
              rows={4}
              defaultValue={
                checkInConfiguration?.arrivalInstructions ??
                ""
              }
              placeholder="Descrivi come raggiungere l'immobile e cosa deve fare l'ospite all'arrivo."
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="accessInstructions"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Istruzioni di accesso
            </label>

            <textarea
              id="accessInstructions"
              name="accessInstructions"
              rows={4}
              defaultValue={
                checkInConfiguration?.accessInstructions ??
                ""
              }
              placeholder="Indica portoni, piani, citofoni, serrature o passaggi necessari per entrare."
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>

          <div>
            <label
              htmlFor="buildingAccessCode"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Codice accesso stabile
            </label>

            <input
              id="buildingAccessCode"
              name="buildingAccessCode"
              type="text"
              defaultValue={
                checkInConfiguration?.buildingAccessCode ??
                ""
              }
              placeholder="Es. 2580"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>

          <div>
            <label
              htmlFor="apartmentAccessCode"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Codice accesso appartamento
            </label>

            <input
              id="apartmentAccessCode"
              name="apartmentAccessCode"
              type="text"
              defaultValue={
                checkInConfiguration
                  ?.apartmentAccessCode ?? ""
              }
              placeholder="Es. 7412"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>

          <div>
            <label
              htmlFor="wifiName"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Nome rete Wi-Fi
            </label>

            <input
              id="wifiName"
              name="wifiName"
              type="text"
              defaultValue={
                checkInConfiguration?.wifiName ?? ""
              }
              placeholder="Es. Horizon Guest"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>

          <div>
            <label
              htmlFor="wifiPassword"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Password Wi-Fi
            </label>

            <input
              id="wifiPassword"
              name="wifiPassword"
              type="text"
              defaultValue={
                checkInConfiguration?.wifiPassword ?? ""
              }
              placeholder="Inserisci la password"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>

          <div>
            <label
              htmlFor="emergencyContactName"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Contatto di emergenza
            </label>

            <input
              id="emergencyContactName"
              name="emergencyContactName"
              type="text"
              defaultValue={
                checkInConfiguration
                  ?.emergencyContactName ?? ""
              }
              placeholder="Nome e cognome"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>

          <div>
            <label
              htmlFor="emergencyContactPhone"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Telefono di emergenza
            </label>

            <input
              id="emergencyContactPhone"
              name="emergencyContactPhone"
              type="tel"
              defaultValue={
                checkInConfiguration
                  ?.emergencyContactPhone ?? ""
              }
              placeholder="+39 333 123 4567"
              autoComplete="tel"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="parkingInstructions"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Istruzioni parcheggio
            </label>

            <textarea
              id="parkingInstructions"
              name="parkingInstructions"
              rows={3}
              defaultValue={
                checkInConfiguration
                  ?.parkingInstructions ?? ""
              }
              placeholder="Indica aree di sosta, accessi, pass o restrizioni."
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="additionalNotes"
              className="mb-2 block text-sm font-medium text-slate-800"
            >
              Note aggiuntive
            </label>

            <textarea
              id="additionalNotes"
              name="additionalNotes"
              rows={4}
              defaultValue={
                checkInConfiguration?.additionalNotes ?? ""
              }
              placeholder="Aggiungi eventuali informazioni operative non coperte dagli altri campi."
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10"
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-6">
          <button
            type="submit"
            className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2"
          >
            Salva configurazione check-in
          </button>
        </div>
      </form>
    </section>
  );
}