import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

import { createProperty } from "../actions";
import { OwnerSelector } from "./OwnerSelector";
import { PropertyLocationMap } from "./PropertyLocationMap";

export default async function NewPropertyPage() {
  const user = await requireUser();

  if (user.role === "OPERATOR") {
    throw new Error("Accesso non autorizzato.");
  }

  const owners =
    await prisma.user.findMany({
      where: {
        role: "OWNER",
        status: "ACTIVE",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
      orderBy: {
        fullName: "asc",
      },
    });

  return (
    <>
      <Navigation />

      <AppShell
        title="Nuovo immobile"
        subtitle="Crea un nuovo appartamento nel portafoglio Horizon."
      >
        <div className="mx-auto max-w-3xl">
          <Link
            href="/properties"
            className="inline-flex text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            ← Torna agli immobili
          </Link>

          <form
            action={createProperty}
            className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <OwnerSelector
                initialOwners={owners}
              />

              <div className="sm:col-span-2">
                <Input
                  name="name"
                  label="Nome immobile"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <Input
                  name="address"
                  label="Indirizzo"
                  required
                />
              </div>

              <Input
                name="city"
                label="Città"
                defaultValue="Milano"
                required
              />

              <Input
                name="zone"
                label="Zona"
                required
              />

              <PropertyLocationMap />

              <Input
                name="maxGuests"
                label="Numero massimo ospiti"
                type="number"
                defaultValue="2"
                required
              />

              <Input
                name="bedrooms"
                label="Camere"
                type="number"
                defaultValue="1"
                required
              />

              <Input
                name="bathrooms"
                label="Bagni"
                type="number"
                defaultValue="1"
                required
              />

              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3">
                <p className="text-sm font-semibold text-blue-900">
                  Prezzo base Revenue AI
                </p>
                <p className="mt-1 text-xs leading-5 text-blue-700">
                  Il prezzo base Revenue AI si riferisce sempre a 2 ospiti.
                </p>
              </div>

              <Input
                name="extraGuestFee"
                label="Supplemento per ospite aggiuntivo (€ / notte)"
                type="number"
                defaultValue="0"
                required
              />

              <Input
                name="cleaningCost"
                label="Costo pulizia per prenotazione (€)"
                type="number"
                defaultValue="0"
                required
              />

              <Input
                name="propertyManagementCommissionPercent"
                label="Commissione Property Manager (%)"
                type="number"
                defaultValue="0"
                required
              />

              <Input
                name="propertyManagementCommissionVatPercent"
                label="IVA commissione (%)"
                type="number"
                defaultValue="0"
                required
              />

              <div>
                <label htmlFor="propertyManagementCommissionVatMode" className="mb-2 block text-sm font-semibold text-slate-700">
                  Modalità IVA commissione
                </label>
                <select
                  id="propertyManagementCommissionVatMode"
                  name="propertyManagementCommissionVatMode"
                  defaultValue="NONE"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
                >
                  <option value="NONE">Nessuna IVA</option>
                  <option value="EXCLUDED">IVA in aggiunta</option>
                  <option value="INCLUDED">IVA compresa</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="notes"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Note
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-6">
              <button
                type="submit"
                name="submitIntent"
                value="create-property"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Crea immobile
              </button>
            </div>
          </form>
        </div>
      </AppShell>
    </>
  );
}

type InputProps = {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
};

function Input({
  name,
  label,
  type = "text",
  defaultValue,
  required = false,
}: InputProps) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        min={type === "number" ? "0" : undefined}
        step={
          name === "cleaningCost"
            ? "0.01"
            : undefined
        }
        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
      />
    </div>
  );
}
