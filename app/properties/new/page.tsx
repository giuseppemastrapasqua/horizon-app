import Link from "next/link";
import { Navigation } from "@/components/Navigation";
import { AppShell } from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { createProperty } from "../actions";

export default async function NewPropertyPage() {
  const owners =
    await prisma.user.findMany({
      where: {
        role: "OWNER",
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
              <div className="sm:col-span-2">
                <label
                  htmlFor="ownerId"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Proprietario
                </label>

                <select
                  id="ownerId"
                  name="ownerId"
                  required
                  defaultValue=""
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                >
                  <option value="" disabled>
                    Seleziona un proprietario
                  </option>

                  {owners.map((owner) => (
                    <option
                      key={owner.id}
                      value={owner.id}
                    >
                      {owner.fullName} · {owner.email}
                    </option>
                  ))}
                </select>
              </div>

            <div className="grid gap-6 sm:grid-cols-2">
