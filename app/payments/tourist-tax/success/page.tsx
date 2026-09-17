import Link from "next/link";

export default function TouristTaxPaymentSuccessPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-xl border p-6">
        <h1 className="text-xl font-semibold">
          Pagamento ricevuto
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          Il pagamento dell'imposta di soggiorno è stato
          completato. Horizon aggiornerà lo stato tramite la
          conferma sicura del provider di pagamento.
        </p>

        <Link
          href="/bookings"
          className="mt-6 inline-block text-sm underline"
        >
          Torna alle prenotazioni
        </Link>
      </div>
    </main>
  );
}
