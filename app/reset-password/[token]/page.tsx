import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050B11] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-[#D8B367]/20 bg-[#09131C] p-8 shadow-xl shadow-black/30">
          <div className="mb-8">
            <div className="text-2xl font-extrabold text-[#D8B367]">Horizon</div>
            <h1 className="mt-5 font-serif text-3xl font-normal text-[#FFF8EA]">Crea una nuova password</h1>
            <p className="mt-2 text-sm leading-6 text-[#8EA0AE]">
              Scegli una nuova password di almeno 10 caratteri. Il link puÃƒÂ² essere utilizzato una sola volta.
            </p>
          </div>

          <ResetPasswordForm token={token} />
        </div>
      </div>
    </main>
  );
}
