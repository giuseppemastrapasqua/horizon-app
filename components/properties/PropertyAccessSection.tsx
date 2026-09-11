import { PropertyAccessRole } from "@prisma/client";

type AccessUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

type PropertyAccess = {
  userId: string;
  role: PropertyAccessRole;
  user: AccessUser;
};

type PropertyAccessSectionProps = {
  propertyId: string;
  users: AccessUser[];
  accesses: PropertyAccess[];
  updateAction: (formData: FormData) => Promise<void>;
};

const roleLabels: Record<PropertyAccessRole, string> = {
  OWNER: "Proprietario",
  MANAGER: "Property Manager",
  FINANCE: "Amministrazione",
  VIEWER: "Sola lettura",
  OPERATOR: "Collaboratore operativo",
};

export function PropertyAccessSection({
  propertyId,
  users,
  accesses,
  updateAction,
}: PropertyAccessSectionProps) {
  const assignedUserIds = new Set(
    accesses.map((access) => access.userId),
  );

  const availableUsers = users.filter(
    (user) => !assignedUserIds.has(user.id),
  );

  return (
    <section
      id="accessi-struttura"
      className="scroll-mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-slate-900">
          Accessi struttura
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Gestisci chi può accedere ai dati della struttura.
          Le responsabilità operative restano separate.
        </p>
      </div>

      {accesses.length > 0 && (
        <div className="mb-8 space-y-3">
          {accesses.map((access) => (
            <div
              key={access.userId}
              className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {access.user.fullName}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {access.user.email}
                </p>

                <span className="mt-2 inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {roleLabels[access.role]}
                </span>
              </div>

              <form action={updateAction}>
                <input
                  type="hidden"
                  name="propertyId"
                  value={propertyId}
                />
                <input
                  type="hidden"
                  name="userId"
                  value={access.userId}
                />
                <input
                  type="hidden"
                  name="enabled"
                  value="false"
                />

                <button
                  type="submit"
                  className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Revoca accesso
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <form
        action={updateAction}
        className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5"
      >
        <input
          type="hidden"
          name="propertyId"
          value={propertyId}
        />
        <input
          type="hidden"
          name="enabled"
          value="true"
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_240px_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Utente
            </span>

            <select
              name="userId"
              required
              defaultValue=""
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950"
            >
              <option value="" disabled>
                Seleziona utente
              </option>

              {availableUsers.map((user) => (
                <option
                  key={user.id}
                  value={user.id}
                >
                  {user.fullName} · {user.email}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Ruolo accesso
            </span>

            <select
              name="role"
              defaultValue={PropertyAccessRole.VIEWER}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950"
            >
              {Object.values(PropertyAccessRole).map(
                (role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ),
              )}
            </select>
          </label>

          <button
            type="submit"
            disabled={availableUsers.length === 0}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Aggiungi accesso
          </button>
        </div>

        {availableUsers.length === 0 && (
          <p className="mt-3 text-xs text-slate-500">
            Tutti gli utenti disponibili sono già assegnati.
          </p>
        )}
      </form>
    </section>
  );
}
