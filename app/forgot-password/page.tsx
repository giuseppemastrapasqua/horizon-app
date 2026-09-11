import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050B11] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-[#D8B367]/20 bg-[#09131C] p-8 shadow-xl shadow-black/30">
          <div className="mb-8">
            <div className="text-2xl font-extrabold text-[#D8B367]">
              Horizon
            </div>

            <h1 className="mt-5 font-serif text-3xl font-normal text-[#FFF8EA]">
              Password dimenticata?
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#8EA0AE]">
              Inserisci lÃ¢â‚¬â„¢email del tuo account. Se esiste un account attivo
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
