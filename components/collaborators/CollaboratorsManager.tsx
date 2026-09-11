"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  createPropertyOperatorInviteAction,
  resendPropertyOperatorInviteAction,
  revokeAcceptedOperatorAccessAction,
  revokePropertyOperatorInviteAction,
} from "@/app/properties/[id]/edit/property-operator-invite-actions";

type PropertyOption = {
  id: string;
  name: string;
  city: string;
};

type Collaborator = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  propertyAccesses: Array<{
    id: string;
    propertyId: string;
    property: {
      id: string;
      name: string;
      city: string;
    };
  }>;
};

type InviteStatus =
  | "PENDING"
  | "ACCEPTED"
  | "EXPIRED"
  | "REVOKED";

type Invite = {
  id: string;
  propertyId: string;
  fullName: string;
  email: string;
  phone: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  status: InviteStatus;
  property: {
    id: string;
    name: string;
    city: string;
  };
};

type Props = {
  properties: PropertyOption[];
  collaborators: Collaborator[];
  invites: Invite[];
};

export function CollaboratorsManager({
  properties,
  collaborators,
  invites,
}: Props) {
  const router = useRouter();

  const [pendingAction, setPendingAction] = useState<string | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [latestInviteUrl, setLatestInviteUrl] = useState("");

  async function handleCreate(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPendingAction("create");
    setMessage("");
    setError("");
    setLatestInviteUrl("");

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);

      const result =
        await createPropertyOperatorInviteAction(formData);

      const absoluteUrl =
        `${window.location.origin}${result.invitePath}`;

      setLatestInviteUrl(absoluteUrl);

      setMessage(
        result.emailSent
          ? "Invito creato e email inviata."
          : "Invito creato, ma l'email non è stata inviata. Usa il link di fallback.",
      );

      form.reset();
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Impossibile creare l'invito.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleResend(invite: Invite) {
    setPendingAction(`resend:${invite.id}`);
    setMessage("");
    setError("");
    setLatestInviteUrl("");

    try {
      const formData = new FormData();

      formData.set("propertyId", invite.propertyId);
      formData.set("inviteId", invite.id);

      const result =
        await resendPropertyOperatorInviteAction(formData);

      const absoluteUrl =
        `${window.location.origin}${result.invitePath}`;

      setLatestInviteUrl(absoluteUrl);

      setMessage(
        result.emailSent
          ? "Invito rigenerato e email inviata."
          : "Invito rigenerato, ma l'email non è stata inviata. Usa il nuovo link di fallback.",
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Impossibile reinviare l'invito.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRevokePending(invite: Invite) {
    if (
      !window.confirm(
        `Revocare l'invito di ${invite.fullName} per ${invite.property.name}?`,
      )
    ) {
      return;
    }

    setPendingAction(`revoke:${invite.id}`);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      formData.set("propertyId", invite.propertyId);
      formData.set("inviteId", invite.id);

      await revokePropertyOperatorInviteAction(formData);

      setMessage("Invito revocato.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Impossibile revocare l'invito.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRevokeAccepted(invite: Invite) {
    if (
      !window.confirm(
        `Revocare l'accesso di ${invite.fullName} alla struttura ${invite.property.name}?`,
      )
    ) {
      return;
    }

    setPendingAction(`access:${invite.id}`);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      formData.set("propertyId", invite.propertyId);
      formData.set("inviteId", invite.id);

      await revokeAcceptedOperatorAccessAction(formData);

      setMessage("Accesso collaboratore revocato.");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Impossibile revocare l'accesso.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function copyLatestInvite() {
    if (!latestInviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latestInviteUrl);
      setMessage("Link copiato negli appunti.");
    } catch {
      setError(
        "Impossibile copiare automaticamente il link. Copialo manualmente.",
      );
    }
  }

  const pendingInvites = invites.filter(
    (invite) =>
      invite.status === "PENDING" ||
      invite.status === "EXPIRED",
  );

  const historicalInvites = invites.filter(
    (invite) =>
      invite.status === "ACCEPTED" ||
      invite.status === "REVOKED",
  );

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Collaboratori"
          value={collaborators.length}
        />

        <SummaryCard
          title="Accessi struttura"
          value={collaborators.reduce(
            (sum, collaborator) =>
              sum + collaborator.propertyAccesses.length,
            0,
          )}
        />

        <SummaryCard
          title="Inviti in attesa"
          value={
            invites.filter(
              (invite) => invite.status === "PENDING",
            ).length
          }
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Nuovo collaboratore
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          Invia un accesso operativo per una struttura.
          L'email viene inviata automaticamente e Horizon
          genera anche un link di fallback.
        </p>

        <form
          onSubmit={handleCreate}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label
              htmlFor="fullName"
              className="text-sm font-medium text-slate-700"
            >
              Nome e cognome
            </label>

            <input
              id="fullName"
              name="fullName"
              required
              minLength={2}
              maxLength={120}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="text-sm font-medium text-slate-700"
            >
              Telefono
            </label>

            <input
              id="phone"
              name="phone"
              maxLength={40}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="propertyId"
              className="text-sm font-medium text-slate-700"
            >
              Struttura
            </label>

            <select
              id="propertyId"
              name="propertyId"
              required
              defaultValue=""
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="" disabled>
                Seleziona struttura
              </option>

              {properties.map((property) => (
                <option
                  key={property.id}
                  value={property.id}
                >
                  {property.name}
                  {property.city
                    ? ` · ${property.city}`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={
                pendingAction === "create" ||
                properties.length === 0
              }
              className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingAction === "create"
                ? "Invio in corso..."
                : "Invia invito"}
            </button>
          </div>
        </form>

        {message ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {latestInviteUrl ? (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Link di fallback
            </p>

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={latestInviteUrl}
                className="min-w-0 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-700"
              />

              <button
                type="button"
                onClick={copyLatestInvite}
                className="rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
              >
                Copia link
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Collaboratori
        </h2>

        {collaborators.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Nessun collaboratore operativo attivo.
          </p>
        ) : (
          <div className="mt-5 grid gap-4">
            {collaborators.map((collaborator) => (
              <article
                key={collaborator.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {collaborator.fullName}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {collaborator.email}
                      {collaborator.phone
                        ? ` · ${collaborator.phone}`
                        : ""}
                    </p>
                  </div>

                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {collaborator.status}
                  </span>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Strutture assegnate
                  </p>

                  {collaborator.propertyAccesses.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">
                      Nessuna struttura attiva.
                    </p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {collaborator.propertyAccesses.map(
                        (access) => (
                          <span
                            key={access.id}
                            className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700"
                          >
                            {access.property.name}
                            {access.property.city
                              ? ` · ${access.property.city}`
                              : ""}
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Inviti da gestire
        </h2>

        {pendingInvites.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
            Nessun invito in attesa o scaduto.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {pendingInvites.map((invite) => (
              <InviteRow
                key={invite.id}
                invite={invite}
                pendingAction={pendingAction}
                onResend={handleResend}
                onRevokePending={handleRevokePending}
                onRevokeAccepted={handleRevokeAccepted}
              />
            ))}
          </div>
        )}
      </section>

      {historicalInvites.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Storico inviti
          </h2>

          <div className="mt-5 grid gap-3">
            {historicalInvites.map((invite) => (
              <InviteRow
                key={invite.id}
                invite={invite}
                pendingAction={pendingAction}
                onResend={handleResend}
                onRevokePending={handleRevokePending}
                onRevokeAccepted={handleRevokeAccepted}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InviteRow({
  invite,
  pendingAction,
  onResend,
  onRevokePending,
  onRevokeAccepted,
}: {
  invite: Invite;
  pendingAction: string | null;
  onResend: (invite: Invite) => Promise<void>;
  onRevokePending: (invite: Invite) => Promise<void>;
  onRevokeAccepted: (invite: Invite) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-4">
      <div>
        <p className="font-medium text-slate-900">
          {invite.fullName}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          {invite.email} · {invite.property.name}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <InviteStatus status={invite.status} />

        {invite.status === "PENDING" ||
        invite.status === "EXPIRED" ? (
          <>
            <button
              type="button"
              disabled={
                pendingAction === `resend:${invite.id}`
              }
              onClick={() => onResend(invite)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {pendingAction === `resend:${invite.id}`
                ? "Invio..."
                : "Rigenera e invia"}
            </button>

            {invite.status === "PENDING" ? (
              <button
                type="button"
                disabled={
                  pendingAction === `revoke:${invite.id}`
                }
                onClick={() => onRevokePending(invite)}
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Revoca invito
              </button>
            ) : null}
          </>
        ) : null}

        {invite.status === "ACCEPTED" ? (
          <button
            type="button"
            disabled={
              pendingAction === `access:${invite.id}`
            }
            onClick={() => onRevokeAccepted(invite)}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            {pendingAction === `access:${invite.id}`
              ? "Revoca..."
              : "Revoca accesso"}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function InviteStatus({
  status,
}: {
  status: InviteStatus;
}) {
  const labels: Record<InviteStatus, string> = {
    PENDING: "In attesa",
    ACCEPTED: "Accettato",
    EXPIRED: "Scaduto",
    REVOKED: "Revocato",
  };

  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
      {labels[status]}
    </span>
  );
}