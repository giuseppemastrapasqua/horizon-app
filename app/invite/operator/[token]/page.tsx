import {
  Building2,
  LockKeyhole,
} from "lucide-react";

import {
  hashOperatorInviteToken,
  isOperatorInviteUsable,
} from "@/lib/auth/property-operator-invite-token";
import { prisma } from "@/lib/prisma";

import { OperatorInviteActivationForm } from "./OperatorInviteActivationForm";

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function OperatorInvitePage({
  params,
}: Props) {
  const { token } = await params;

  const invite =
    await prisma.propertyOperatorInvite.findUnique({
      where: {
        tokenHash: hashOperatorInviteToken(token),
      },
      select: {
        email: true,
        fullName: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        property: {
          select: {
            name: true,
          },
        },
      },
    });

  const usable =
    invite &&
    isOperatorInviteUsable(invite);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <Building2 className="size-5" />
          </div>

          <div>
            <p className="font-semibold text-slate-950">
              Horizon
            </p>

            <p className="text-sm text-slate-500">
              Accesso collaboratore
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          {!usable ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100">
                <LockKeyhole className="size-5 text-slate-500" />
              </div>

              <h1 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
                Invito non disponibile
              </h1>

              <p className="mt-3 leading-7 text-slate-500">
                Il link è scaduto, è stato revocato oppure è già stato utilizzato.
                Richiedi un nuovo invito all&apos;amministratore Horizon.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-blue-600">
                Sei stato invitato in Horizon
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Attiva il tuo accesso
              </h1>

              <p className="mt-3 leading-7 text-slate-500">
                Configura il tuo accesso collaboratore alla struttura{" "}
                <span className="font-medium text-slate-700">
                  {invite.property.name}
                </span>
                .
              </p>

              <div className="my-7 border-t border-slate-100" />

              <OperatorInviteActivationForm
                token={token}
                email={invite.email}
                fullName={invite.fullName}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}