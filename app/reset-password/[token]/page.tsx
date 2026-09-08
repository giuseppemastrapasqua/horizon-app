import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
          <div className="mb-8">
            <div className="text-2xl font-extrabold text-blue-600">Horizon</div>
            <h1 className="mt-5 text-2xl font-bold text-slate-950">Crea una nuova password</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Scegli una nuova password di almeno 10 caratteri. Il link può essere utilizzato una sola volta.
            </p>
          </div>

          <ResetPasswordForm token={token} />
        </div>
      </div>
    </main>
  );
}
