import {
  Building2,
  LockKeyhole,
} from "lucide-react";

import {
  hashOwnerInviteToken,
  isOwnerInviteUsable,
} from "@/lib/auth/property-owner-invite-token";
import { prisma } from "@/lib/prisma";

import { OwnerInviteActivationForm } from "./OwnerInviteActivationForm";

type Props = {
  params: Promise<{
    token: string;
  }>;
};

export default async function OwnerInvitePage({
  params,
}: Props) {
  const { token } = await params;

  const invite =
    await prisma.propertyOwnerInvite.findUnique({
      where: {
        tokenHash: hashOwnerInviteToken(token),
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
    isOwnerInviteUsable(invite);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050B11] px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#D8B367] text-[#07111A]">
            <Building2 className="size-5" />
          </div>

          <div>
            <p className="font-semibold text-[#FFF8EA]">
              Horizon
            </p>

            <p className="text-sm text-[#8EA0AE]">
              Accesso proprietario
            </p>
          </div>
        </div>

        <section className="rounded-3xl border border-[#D8B367]/20 bg-[#09131C] p-7 shadow-sm sm:p-9">
          {!usable ? (
            <>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#0D1923]">
                <LockKeyhole className="size-5 text-[#8EA0AE]" />
              </div>

              <h1 className="mt-6 font-serif text-3xl font-normal tracking-tight text-[#FFF8EA]">
                Invito non disponibile
              </h1>

              <p className="mt-3 leading-7 text-[#8EA0AE]">
                Il link ÃƒÂ¨ scaduto, ÃƒÂ¨ stato revocato oppure ÃƒÂ¨ giÃƒÂ  stato utilizzato.
                Richiedi un nuovo invito all&apos;amministratore Horizon.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-[#D8B367]">
                Sei stato invitato in Horizon
              </p>

              <h1 className="mt-2 font-serif text-4xl font-normal tracking-tight text-[#FFF8EA]">
                Attiva il tuo accesso
              </h1>

              <p className="mt-3 leading-7 text-[#8EA0AE]">
                Configura il tuo accesso alla struttura{" "}
                <span className="font-medium text-[#FFF8EA]">
                  {invite.property.name}
                </span>
                .
              </p>

              <div className="my-7 border-t border-white/10" />

              <OwnerInviteActivationForm
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