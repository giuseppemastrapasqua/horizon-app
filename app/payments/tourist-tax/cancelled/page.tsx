import Link from "next/link";

export default function TouristTaxPaymentCancelledPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-xl border p-6">
        <h1 className="text-xl font-semibold">
          Pagamento non completato
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          Nessun pagamento è stato confermato. Puoi tornare
          alla prenotazione e utilizzare nuovamente il link
          di pagamento.
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
