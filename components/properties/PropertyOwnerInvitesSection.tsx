"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  createPropertyOwnerInviteAction,
  deleteSuperAdminOwnerInviteAction,
  resendPropertyOwnerInviteAction,
  revokeAcceptedOwnerAccessAction,
  revokePropertyOwnerInviteAction,
  upsertOwnerBillingProfileAction,
} from "@/app/properties/[id]/edit/property-owner-invite-actions";
import { updatePropertyAccessAction } from "@/app/properties/[id]/edit/property-access-actions";

type OwnerBillingProfile = {
  entityType: "PRIVATE" | "VAT_REGISTERED";
  firstName: string | null;
  lastName: string | null;
  businessName: string | null;
  taxCode: string | null;
  vatNumber: string | null;
  address: string;
  postalCode: string;
  city: string;
  province: string | null;
  country: string;
  email: string;
  pec: string | null;
  recipientCode: string | null;
};

type Invite = {
  id: string;
  fullName: string;
  email: string;
  expiresAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

type ActiveOwner = {
  userId: string;
  email: string;
  isSuperAdmin: boolean;
};

type Props = {
  propertyId: string;
  invites: Invite[];
  activeOwners: ActiveOwner[];
  ownerBillingProfile: OwnerBillingProfile | null;
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

function isBillingProfileComplete(profile: OwnerBillingProfile | null) {
  if (!profile) {
    return false;
  }

  const commonComplete = Boolean(
    profile.address &&
      profile.postalCode &&
      profile.city &&
      profile.country &&
      profile.email,
  );

  if (!commonComplete) {
    return false;
  }

  if (profile.entityType === "PRIVATE") {
    return Boolean(
      profile.firstName &&
        profile.lastName &&
        profile.taxCode,
    );
  }

  return Boolean(profile.businessName && profile.vatNumber);
}

const fieldClassName =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10";

export function PropertyOwnerInvitesSection({
  propertyId,
  invites,
  activeOwners,
  ownerBillingProfile,
}: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [latestLink, setLatestLink] = useState("");
  const [billingOpen, setBillingOpen] = useState(false);
  const [billingType, setBillingType] = useState<
    "PRIVATE" | "VAT_REGISTERED"
  >(ownerBillingProfile?.entityType ?? "PRIVATE");

  const billingComplete =
    isBillingProfileComplete(ownerBillingProfile);

  const activeOwnerByEmail = new Map(
    activeOwners.map((owner) => [
      owner.email.trim().toLowerCase(),
      owner,
    ]),
  );

  function makeAbsoluteLink(invitePath: string) {
    return new URL(
      invitePath,
      window.location.origin,
    ).toString();
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

  function handleRevokeAccess(inviteId: string) {
    const confirmed = window.confirm(
      "Revocare l'accesso di questo proprietario alla struttura?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setLatestLink("");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("propertyId", propertyId);
        formData.set("inviteId", inviteId);

        await revokeAcceptedOwnerAccessAction(formData);
        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Impossibile revocare l'accesso.",
        );
      }
    });
  }

  function handleSuperAdminCleanup(inviteId: string) {
    const confirmed = window.confirm(
      "Rimuovere tutti gli inviti proprietario errati associati al Super Admin?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setLatestLink("");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("propertyId", propertyId);
        formData.set("inviteId", inviteId);

        await deleteSuperAdminOwnerInviteAction(formData);
        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Impossibile pulire gli inviti Super Admin.",
        );
      }
    });
  }

  function handleBillingSave(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setError("");

    startTransition(async () => {
      try {
        await upsertOwnerBillingProfileAction(formData);

        setBillingOpen(false);
        router.refresh();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Impossibile salvare i dati del proprietario.",
        );
      }
    });
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-600">
            Proprietari
          </p>

          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            Inviti proprietari
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Invita un proprietario a creare il proprio accesso
            Horizon. Le password non vengono mai inviate o
            memorizzate in chiaro.
          </p>
        </div>

        <div className="w-full rounded-2xl border border-blue-100 bg-blue-50/60 p-4 lg:w-80">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Dati proprietario
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Dati fiscali per rendiconti e fatture.
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                billingComplete
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {billingComplete ? "Completi" : "Da completare"}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setBillingOpen((current) => !current)
            }
            className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            {billingOpen ? "Chiudi" : "Gestisci dati"}
          </button>
        </div>
      </div>

      {billingOpen ? (
        <form
          onSubmit={handleBillingSave}
          className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-5"
        >
          <input
            type="hidden"
            name="propertyId"
            value={propertyId}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="ownerBillingEntityType"
                className="text-sm font-medium text-slate-700"
              >
                Tipo proprietario
              </label>

              <select
                id="ownerBillingEntityType"
                name="entityType"
                value={billingType}
                onChange={(event) =>
                  setBillingType(
                    event.target.value as
                      | "PRIVATE"
                      | "VAT_REGISTERED",
                  )
                }
                className={fieldClassName}
              >
                <option value="PRIVATE">Privato</option>
                <option value="VAT_REGISTERED">
                  Partita IVA
                </option>
              </select>
            </div>

            {billingType === "PRIVATE" ? (
              <>
                <div>
                  <label
                    htmlFor="ownerBillingFirstName"
                    className="text-sm font-medium text-slate-700"
                  >
                    Nome
                  </label>
                  <input
                    id="ownerBillingFirstName"
                    name="firstName"
                    required
                    maxLength={120}
                    defaultValue={
                      ownerBillingProfile?.firstName ?? ""
                    }
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="ownerBillingLastName"
                    className="text-sm font-medium text-slate-700"
                  >
                    Cognome
                  </label>
                  <input
                    id="ownerBillingLastName"
                    name="lastName"
                    required
                    maxLength={120}
                    defaultValue={
                      ownerBillingProfile?.lastName ?? ""
                    }
                    className={fieldClassName}
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="ownerBillingTaxCodePrivate"
                    className="text-sm font-medium text-slate-700"
                  >
                    Codice fiscale
                  </label>
                  <input
                    id="ownerBillingTaxCodePrivate"
                    name="taxCode"
                    required
                    maxLength={32}
                    defaultValue={
                      ownerBillingProfile?.taxCode ?? ""
                    }
                    className={fieldClassName}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="ownerBillingBusinessName"
                    className="text-sm font-medium text-slate-700"
                  >
                    Ragione sociale
                  </label>
                  <input
                    id="ownerBillingBusinessName"
                    name="businessName"
                    required
                    maxLength={160}
                    defaultValue={
                      ownerBillingProfile?.businessName ?? ""
                    }
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="ownerBillingVatNumber"
                    className="text-sm font-medium text-slate-700"
                  >
                    Partita IVA
                  </label>
                  <input
                    id="ownerBillingVatNumber"
                    name="vatNumber"
                    required
                    maxLength={32}
                    defaultValue={
                      ownerBillingProfile?.vatNumber ?? ""
                    }
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="ownerBillingTaxCodeVat"
                    className="text-sm font-medium text-slate-700"
                  >
                    Codice fiscale
                  </label>
                  <input
                    id="ownerBillingTaxCodeVat"
                    name="taxCode"
                    maxLength={32}
                    defaultValue={
                      ownerBillingProfile?.taxCode ?? ""
                    }
                    className={fieldClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="ownerBillingRecipientCode"
                    className="text-sm font-medium text-slate-700"
                  >
                    Codice destinatario SDI
                  </label>
                  <input
                    id="ownerBillingRecipientCode"
                    name="recipientCode"
                    maxLength={20}
                    defaultValue={
                      ownerBillingProfile?.recipientCode ?? ""
                    }
                    className={fieldClassName}
                  />
                </div>
              </>
            )}

            <div className="md:col-span-2">
              <label
                htmlFor="ownerBillingAddress"
                className="text-sm font-medium text-slate-700"
              >
                Indirizzo fiscale
              </label>
              <input
                id="ownerBillingAddress"
                name="address"
                required
                maxLength={200}
                defaultValue={
                  ownerBillingProfile?.address ?? ""
                }
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="ownerBillingPostalCode"
                className="text-sm font-medium text-slate-700"
              >
                CAP
              </label>
              <input
                id="ownerBillingPostalCode"
                name="postalCode"
                required
                maxLength={20}
                defaultValue={
                  ownerBillingProfile?.postalCode ?? ""
                }
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="ownerBillingCity"
                className="text-sm font-medium text-slate-700"
              >
                CittÃƒÆ’Ã‚Â 
              </label>
              <input
                id="ownerBillingCity"
                name="city"
                required
                maxLength={120}
                defaultValue={ownerBillingProfile?.city ?? ""}
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="ownerBillingProvince"
                className="text-sm font-medium text-slate-700"
              >
                Provincia
              </label>
              <input
                id="ownerBillingProvince"
                name="province"
                maxLength={80}
                defaultValue={
                  ownerBillingProfile?.province ?? ""
                }
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="ownerBillingCountry"
                className="text-sm font-medium text-slate-700"
              >
                Paese
              </label>
              <input
                id="ownerBillingCountry"
                name="country"
                required
                minLength={2}
                maxLength={2}
                defaultValue={
                  ownerBillingProfile?.country ?? "IT"
                }
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="ownerBillingEmail"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="ownerBillingEmail"
                name="email"
                type="email"
                required
                defaultValue={
                  ownerBillingProfile?.email ?? ""
                }
                className={fieldClassName}
              />
            </div>

            <div>
              <label
                htmlFor="ownerBillingPec"
                className="text-sm font-medium text-slate-700"
              >
                PEC
              </label>
              <input
                id="ownerBillingPec"
                name="pec"
                type="email"
                defaultValue={
                  ownerBillingProfile?.pec ?? ""
                }
                className={fieldClassName}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Salvataggio..."
                : "Salva dati proprietario"}
            </button>
          </div>
        </form>
      ) : null}

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
            className={fieldClassName}
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
            className={fieldClassName}
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Operazione..." : "Crea invito"}
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
              !invite.acceptedAt && !invite.revokedAt;

            const activeOwner =
  invite.acceptedAt && !invite.revokedAt
    ? activeOwnerByEmail.get(
        invite.email.trim().toLowerCase(),
      )
    : undefined;

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
                    {" Ãƒâ€šÃ‚Â· "}
                    Scade {formatDate(invite.expiresAt)}
                  </p>
                </div>

                {canManage || (invite.acceptedAt && !invite.revokedAt) ? (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {canManage ? (
                      <>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleResend(invite.id)
                          }
                          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          Rigenera link
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() =>
                            handleRevoke(invite.id)
                          }
                          className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          Revoca invito
                        </button>
                      </>
                    ) : null}

                    {invite.acceptedAt && !invite.revokedAt ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          activeOwner?.isSuperAdmin
                            ? handleSuperAdminCleanup(invite.id)
                            : handleRevokeAccess(invite.id)
                        }
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        {activeOwner?.isSuperAdmin
                          ? "Pulisci inviti Super Admin"
                          : "Revoca accesso"}
                      </button>
                    ) : null}
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
