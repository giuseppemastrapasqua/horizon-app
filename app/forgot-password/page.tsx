import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
          <div className="mb-8">
            <div className="text-2xl font-extrabold text-blue-600">
              Horizon
            </div>

            <h1 className="mt-5 text-2xl font-bold text-slate-950">
              Password dimenticata?
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Inserisci l’email del tuo account. Se esiste un account attivo
              associato a questo indirizzo, riceverai un link valido per 30
              minuti.
            </p>
          </div>

          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
