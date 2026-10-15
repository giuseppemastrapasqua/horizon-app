import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { requireUser } from "@/lib/auth/guards";

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <>
      <Navigation />
      <AppShell title="Il tuo profilo" subtitle="Dati del tuo account Horizon.">
        <section className="max-w-xl rounded-2xl border border-white/10 bg-white/[0.035] p-6">
          <dl className="space-y-5">
            <div>
              <dt className="text-sm text-white/50">Nome</dt>
              <dd>{user.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/50">Email</dt>
              <dd>{user.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/50">Ruolo</dt>
              <dd>{user.role}</dd>
            </div>
          </dl>
        </section>
      </AppShell>
    </>
  );
}
