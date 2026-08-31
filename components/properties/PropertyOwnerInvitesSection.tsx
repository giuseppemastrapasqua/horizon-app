"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createPropertyOwnerInviteAction,
  resendPropertyOwnerInviteAction,
  revokePropertyOwnerInviteAction,
} from "@/app/properties/[id]/edit/property-owner-invite-actions";

type Invite = {
  id: string;
  fullName: string;
  email: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type Props = {
  propertyId: string;
  invites: Invite[];
};

function getInviteStatus(invite: Invite) {
  if (invite.acceptedAt) {
    return {
      label: "Accettato",
      className: "bg-emerald-50 text-emerald-700",
    };
  }

  if (invite.revokedAt) {
    return {
      label: "Revocato",
      className: "bg-slate-100 text-slate-600",
    };
  }

  if (new Date(invite.expiresAt).getTime() <= Date.now()) {
    return {
      label: "Scaduto",
      className: "bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Attivo",
    className: "bg-blue-50 text-blue-700",
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function PropertyOwnerInvitesSection({
  propertyId,
  invites,
}: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [latestLink, setLatestLink] = useState("");

  function makeAbsoluteLink(invitePath: string) {
    return new URL(invitePath, window.location.origin).toString();
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link);
  }

  function handleCreate(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setLatestLink("");

    startTransition(async () => {
      try {
        const result =
          await createPropertyOwnerInviteAction(formData);

        const link = makeAbsoluteLink(result.invitePath);

        setLatestLink(link);
        await copyLink(link);

        form.reset();
        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Impossibile creare l'invito.",
        );
      }
    });
  }

  function handleResend(inviteId: string) {
    setError("");
    setLatestLink("");

    startTransition(async () => {
      try {
        const formData = new FormData();

        formData.set("propertyId", propertyId);
        formData.set("inviteId", inviteId);

        const result =
          await resendPropertyOwnerInviteAction(formData);

        const link = makeAbsoluteLink(result.invitePath);

        setLatestLink(link);
        await copyLink(link);

        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Impossibile rigenerare l'invito.",
        );
      }
    });
  }

  function handleRevoke(inviteId: string) {
    setError("");

    startTransition(async () => {
      try {
        const formData = new FormData();

        formData.set("propertyId", propertyId);
        formData.set("inviteId", inviteId);

        await revokePropertyOwnerInviteAction(formData);

        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Impossibile revocare l'invito.",
        );
      }
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Proprietari
        </p>

        <h2 className="mt-1 text-2xl font-semibold text-slate-900">
          Inviti proprietari
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Invita un proprietario a creare il proprio accesso Horizon.
          Le password non vengono mai inviate o memorizzate in chiaro.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-2"
      >
        <input
          type="hidden"
          name="propertyId"
          value={propertyId}
        />

        <div>
          <label
            htmlFor="ownerInviteFullName"
            className="text-sm font-medium text-slate-700"
          >
            Nome proprietario
          </label>

          <input
            id="ownerInviteFullName"
            name="fullName"
            required
            minLength={2}
            maxLength={120}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
          />
        </div>

        <div>
          <label
            htmlFor="ownerInviteEmail"
            className="text-sm font-medium text-slate-700"
          >
            Email
          </label>

          <input
            id="ownerInviteEmail"
            name="email"
            type="email"
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "Operazione..."
              : "Crea invito"}
          </button>
        </div>
      </form>

      {latestLink ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Nuovo link copiato negli appunti
          </p>

          <div className="mt-3 flex gap-2">
            <input
              readOnly
              value={latestLink}
              className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700"
            />

            <button
              type="button"
              onClick={() => copyLink(latestLink)}
              className="rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
            >
              Copia
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-7 space-y-3">
        {invites.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 px-5 py-6 text-sm text-slate-500">
            Nessun invito proprietario creato.
          </p>
        ) : (
          invites.map((invite) => {
            const status = getInviteStatus(invite);
            const canManage =
              !invite.acceptedAt &&
              !invite.revokedAt;

            return (
              <div
                key={invite.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      {invite.fullName}
                    </p>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {invite.email}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Creato {formatDate(invite.createdAt)}
                    {" · "}
                    Scade {formatDate(invite.expiresAt)}
                  </p>
                </div>

                {canManage ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleResend(invite.id)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Rigenera link
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleRevoke(invite.id)}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                    >
                      Revoca
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}