import { readReportBookingSnapshot } from "@/lib/finance/report-booking-snapshot";
import type { BookingFinanceBreakdown } from "@/lib/finance/calculations/build-booking-finance-breakdown";
import {
  reserveOwnerPersonalUse,
  releaseOwnerPersonalUse,
} from "@/app/calendar/owner-personal-use-actions";
import { ownerPersonalUseNote } from "@/lib/owners/personal-use-policy";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { getAccessiblePropertyIds, requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import {
  ownerBookingLabel,
  ownerPropertyDocumentTypes,
  ownerTaskTypes,
  scopedPropertyFilter,
} from "@/lib/owners/portal-policy";

const channelNames: Record<string, string> = {
  BOOKING: "Booking.com",
  AIRBNB: "Airbnb",
  VRBO: "Vrbo",
  DIRECT: "Diretta",
  OTHER: "Altro",
};
const bookingStates: Record<string, string> = {
  PENDING: "In attesa",
  CONFIRMED: "Confermata",
  CHECKED_IN: "In corso",
  CHECKED_OUT: "Conclusa",
  CANCELLED: "Annullata",
};
const taskStates: Record<string, string> = {
  TODO: "Da svolgere",
  IN_PROGRESS: "In corso",
  DONE: "Completato",
  CANCELLED: "Annullato",
};
const card = "rounded-2xl border border-white/10 bg-white/[0.035] p-5";
const date = (value: Date) =>
  value.toLocaleDateString("it-IT", { timeZone: "UTC" });
const money = (value: unknown, currency = "EUR") =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(
    Number(value),
  );

async function ownerScope() {
  await requireRoles(["OWNER"]);
  return (await getAccessiblePropertyIds()) ?? [];
}

function Frame({ title, children, navigation = true }: { title: string; children: ReactNode; navigation?: boolean }) {
  return (
    <>
      {navigation ? <Navigation /> : null}
      <AppShell
        title={title}
        subtitle="Il tuo patrimonio, con una visione chiara di soggiorni, risultati e documenti."
      >
        <div className="space-y-5">{children}</div>
      </AppShell>
    </>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className={`${card} text-sm text-white/60`}>{children}</p>;
}

export async function OwnerDashboard() {
  const ids = await ownerScope();
  const now = new Date();
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  const [properties, bookings, reports] = await Promise.all([
    prisma.property.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        propertyId: { in: ids },
        bookingStatus: { not: "CANCELLED" },
        checkOut: { gte: month, lt: nextMonth },
      },
      select: { grossAmount: true, currency: true, nights: true },
    }),
    prisma.financeReport.findMany({
      where: { propertyId: { in: ids } },
      take: 6,
      orderBy: { referenceMonth: "desc" },
      select: {
        id: true,
        title: true,
        currency: true,
        finalAmount: true,
        adjustments: { select: { amount: true } },
        property: { select: { name: true } },
      },
    }),
  ]);
  const amounts = new Map<string, number>();
  for (const booking of bookings)
    amounts.set(
      booking.currency,
      (amounts.get(booking.currency) ?? 0) + Number(booking.grossAmount),
    );
  return (
    <Frame title="Il tuo portfolio" navigation={false}>
      <Link href="/performance" className="text-sm text-[#D8B367]">
        Analisi delle performance del mese →
      </Link>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className="text-sm text-white/60">Strutture</p>
          <p className="mt-2 text-3xl">{properties.length}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-white/60">
            Soggiorni conclusi questo mese
          </p>
          <p className="mt-2 text-3xl">{bookings.length}</p>
        </div>
        <div className={card}>
          <p className="text-sm text-white/60">
            Ricavi lordi del mese di check-out
          </p>
          <p className="mt-2 text-2xl">
            {[...amounts]
              .map(([currency, amount]) => money(amount, currency))
              .join(" · ") || money(0)}
          </p>
        </div>
      </div>
      <section className={card}>
        <h2 className="mb-4 text-xl">Le tue strutture</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {properties.map((property) => (
            <Link
              className="rounded-xl border border-white/10 p-4 hover:bg-white/5"
              key={property.id}
              href={`/calendar?propertyId=${property.id}`}
            >
              <p>{property.name}</p>
              <p className="text-sm text-white/60">
                {property.city} · Apri calendario
              </p>
            </Link>
          ))}
        </div>
        {!properties.length && (
          <p>Nessuna struttura associata al tuo account.</p>
        )}
      </section>
      <section className={card}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl">Ultimi rendiconti</h2>
          <Link className="text-sm text-[#D8B367]" href="/documents">
            Tutti i documenti
          </Link>
        </div>
        {reports.map((report) => (
          <Link
            className="flex justify-between gap-3 border-t border-white/10 py-3"
            href={`/reports/monthly/${report.id}`}
            key={report.id}
          >
            <span>
              {report.property.name} · {report.title}
            </span>
            <span>
              {money(
                Number(report.finalAmount) +
                  report.adjustments.reduce(
                    (total, item) => total + Number(item.amount),
                    0,
                  ),
                report.currency,
              )}
            </span>
          </Link>
        ))}
        {!reports.length && (
          <p className="text-white/60">
            I rendiconti saranno disponibili dopo la preparazione da parte del
            gestore.
          </p>
        )}
      </section>
    </Frame>
  );
}

export async function OwnerBookings({ propertyId }: { propertyId?: string }) {
  const ids = await ownerScope();
  const bookings = await prisma.booking.findMany({
    where: { propertyId: scopedPropertyFilter(ids, propertyId) },
    orderBy: { checkIn: "desc" },
    take: 200,
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guests: true,
      channel: true,
      bookingStatus: true,
      grossAmount: true,
      currency: true,
      property: { select: { name: true } },
    },
  });
  return (
    <Frame title="Prenotazioni">
      <p className="text-sm text-white/60">
        Ultime 200 prenotazioni. Gli ospiti sono identificati con un riferimento
        anonimo.
      </p>
      {bookings.length ? (
        <>
        <div className="space-y-3 md:hidden">
          {bookings.map((booking) => (
            <article className={`${card} min-w-0`} key={booking.id}>
              <Link className="block break-words font-semibold text-[#D8B367]" href={`/bookings/${booking.id}`}>
                {booking.property.name}
                <span className="mt-1 block text-xs font-normal text-white/60">{ownerBookingLabel(booking.id)}</span>
              </Link>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2"><dt className="text-white/60">Soggiorno</dt><dd>{date(booking.checkIn)} – {date(booking.checkOut)} · {booking.nights} notti</dd></div>
                <div><dt className="text-white/60">Ospiti</dt><dd>{booking.guests}</dd></div>
                <div><dt className="text-white/60">Canale</dt><dd>{channelNames[booking.channel] ?? booking.channel}</dd></div>
                <div><dt className="text-white/60">Stato</dt><dd>{bookingStates[booking.bookingStatus] ?? booking.bookingStatus}</dd></div>
                <div><dt className="text-white/60">Lordo</dt><dd>{money(booking.grossAmount, booking.currency)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        <div className={`${card} hidden overflow-x-auto md:block`}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {[
                  "Struttura / prenotazione",
                  "Soggiorno",
                  "Ospiti",
                  "Canale",
                  "Stato",
                  "Lordo",
                ].map((label) => (
                  <th className="p-3" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr className="border-t border-white/10" key={booking.id}>
                  <td className="p-3">
                    <Link href={`/bookings/${booking.id}`}>
                      {booking.property.name}
                      <br />
                      <span className="text-white/60">
                        {ownerBookingLabel(booking.id)}
                      </span>
                    </Link>
                  </td>
                  <td className="p-3">
                    {date(booking.checkIn)} – {date(booking.checkOut)}
                    <br />
                    {booking.nights} notti
                  </td>
                  <td className="p-3">{booking.guests}</td>
                  <td className="p-3">
                    {channelNames[booking.channel] ?? booking.channel}
                  </td>
                  <td className="p-3">
                    {bookingStates[booking.bookingStatus] ??
                      booking.bookingStatus}
                  </td>
                  <td className="p-3">
                    {money(booking.grossAmount, booking.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <Empty>Nessuna prenotazione disponibile.</Empty>
      )}
    </Frame>
  );
}

export async function OwnerBookingDetail({ id }: { id: string }) {
  const ids = await ownerScope();
  const booking = await prisma.booking.findFirst({
    where: { id, propertyId: { in: ids } },
    select: {
      id: true,
      checkIn: true,
      checkOut: true,
      nights: true,
      guests: true,
      channel: true,
      bookingStatus: true,
      grossAmount: true,
      currency: true,
      property: { select: { name: true } },
    },
  });
  if (!booking) notFound();
  return (
    <Frame title={ownerBookingLabel(booking.id)}>
      <Link href="/bookings">← Prenotazioni</Link>
      <section className={card}>
        <h2 className="text-xl">{booking.property.name}</h2>
        <p className="mt-4">
          {date(booking.checkIn)} – {date(booking.checkOut)} · {booking.nights}{" "}
          notti · {booking.guests} ospiti
        </p>
        <p className="mt-2">
          {channelNames[booking.channel] ?? booking.channel} ·{" "}
          {bookingStates[booking.bookingStatus] ?? booking.bookingStatus}
        </p>
        <p className="mt-4 text-2xl">
          {money(booking.grossAmount, booking.currency)}
        </p>
      </section>
    </Frame>
  );
}

export async function OwnerTasks({ id }: { id?: string }) {
  const ids = await ownerScope();
  const tasks = await prisma.task.findMany({
    where: {
      ...(id ? { id } : {}),
      propertyId: { in: ids },
      type: { in: [...ownerTaskTypes] },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      title: true,
      status: true,
      type: true,
      dueDate: true,
      property: { select: { name: true } },
    },
  });
  if (id && !tasks.length) notFound();
  return (
    <Frame title="Interventi e manutenzione">
      {id && <Link href="/tasks">← Task</Link>}
      {tasks.length ? (
        tasks.map((task) => (
          <section className={card} key={task.id}>
            <Link href={`/tasks/${task.id}`} className="text-lg">
              {task.title}
            </Link>
            <p className="mt-2 text-sm text-white/60">
              {task.property.name} ·{" "}
              {task.type === "MAINTENANCE" ? "Manutenzione" : "Intervento"} ·{" "}
              {taskStates[task.status] ?? task.status}
              {task.dueDate ? ` · ${date(task.dueDate)}` : ""}
            </p>
          </section>
        ))
      ) : (
        <Empty>Nessun intervento disponibile.</Empty>
      )}
    </Frame>
  );
}

export async function OwnerDocuments() {
  const ids = await ownerScope();
  const [reports, invoices, contracts] = await Promise.all([
    prisma.financeReport.findMany({
      where: { propertyId: { in: ids } },
      orderBy: { referenceMonth: "desc" },
      take: 100,
      select: { id: true, title: true, property: { select: { name: true } } },
    }),
    prisma.document.findMany({
      where: {
        propertyId: { in: ids },
        type: "COMMISSION_INVOICE",
        status: { in: ["FINAL", "ISSUED"] },
      },
      orderBy: { referenceMonth: "desc" },
      take: 100,
      select: {
        id: true,
        title: true,
        documentNumber: true,
        property: { select: { name: true } },
      },
    }),
    prisma.propertyDocument.findMany({
      where: {
        propertyId: { in: ids },
        type: { in: ownerPropertyDocumentTypes },
        storageKey: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        propertyId: true,
        title: true,
        type: true,
        property: { select: { name: true } },
      },
    }),
  ]);
  return (
    <Frame title="Documenti">
      <section className={card}>
        <h2 className="mb-3 text-xl">Rendiconti</h2>
        {reports.map((report) => (
          <div
            className="flex flex-wrap justify-between gap-3 border-t border-white/10 py-3"
            key={report.id}
          >
            <Link href={`/reports/monthly/${report.id}`}>
              {report.property.name} · {report.title}
            </Link>
            <Link
              href={`/reports/monthly/${report.id}/pdf`}
              className="text-[#D8B367]"
            >
              Scarica PDF
            </Link>
          </div>
        ))}
        {!reports.length && (
          <p className="text-white/60">Nessun rendiconto disponibile.</p>
        )}
      </section>
      <section className={card}>
        <h2 className="mb-3 text-xl">Fatture</h2>
        {invoices.map((invoice) => (
          <Link
            className="block border-t border-white/10 py-3"
            key={invoice.id}
            href={`/invoices/${invoice.id}/pdf`}
          >
            {invoice.property?.name} · {invoice.documentNumber || invoice.title}{" "}
            · PDF
          </Link>
        ))}
        {!invoices.length && (
          <p className="text-white/60">Nessuna fattura pubblicata.</p>
        )}
      </section>
      <section className={card}>
        <h2 className="mb-3 text-xl">Contratti e documenti della struttura</h2>
        {contracts.map((document) => (
          <Link
            className="block border-t border-white/10 py-3"
            key={document.id}
            href={`/properties/${document.propertyId}/documents/${document.id}/file`}
          >
            {document.property.name} · {document.title}
          </Link>
        ))}
        {!contracts.length && (
          <p className="text-white/60">Nessun allegato disponibile.</p>
        )}
      </section>
    </Frame>
  );
}

export async function OwnerReport({ id }: { id: string }) {
  const ids = await ownerScope();
  const report = await prisma.financeReport.findFirst({
    where: { id, propertyId: { in: ids } },
    select: {
      id: true,
      title: true,
      referenceMonth: true,
      currency: true,
      grossRevenue: true,
      finalAmount: true,
      formulaName: true,
      formulaSnapshot: true,
      property: { select: { name: true } },
      rules: {
        orderBy: { order: "asc" },
        select: { id: true, ruleName: true, calculatedAmount: true },
      },
      adjustments: { select: { id: true, description: true, amount: true } },
    },
  });
  if (!report) notFound();
  const savedBookings = readReportBookingSnapshot(report.formulaSnapshot);
  const sum = (key: keyof BookingFinanceBreakdown) =>
    (savedBookings ?? []).reduce(
      (total, booking) => total + (booking.breakdown[key] ?? 0),
      0,
    );
  const costRows = savedBookings
    ? ([
        ["Commissioni OTA", sum("otaCommission")],
        ["Pulizia", sum("cleaningCost")],
        ["Commissione gestione inclusa IVA", sum("managementCommissionTotal")],
        ["Imposte", sum("taxAmount")],
        ["Altri importi", sum("otherAmount")],
      ] as const)
    : [];
  const adjustments = report.adjustments.reduce(
    (total, item) => total + Number(item.amount),
    0,
  );
  return (
    <Frame title={report.title}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link href="/documents">← Documenti</Link>
        <Link
          href={`/reports/monthly/${report.id}/pdf`}
          className="text-[#D8B367]"
        >
          Scarica PDF
        </Link>
      </div>
      <section className={card}>
        <h2 className="text-xl">{report.property.name}</h2>
        <p className="mt-2 text-white/60">
          {report.referenceMonth.toLocaleDateString("it-IT", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}{" "}
          · {report.formulaName}
        </p>
        <p className="mt-5">
          Ricavi lordi: {money(report.grossRevenue, report.currency)}
        </p>
        {costRows.map(([label, amount]) => (
          <p className="mt-3 flex justify-between" key={label}>
            <span>{label}</span>
            <span>{money(amount, report.currency)}</span>
          </p>
        ))}
        {!savedBookings &&
          report.rules.map((rule) => (
            <p className="mt-3 flex justify-between" key={rule.id}>
              <span>{rule.ruleName}</span>
              <span>{money(rule.calculatedAmount, report.currency)}</span>
            </p>
          ))}
        {report.adjustments.map((adjustment) => (
          <p className="mt-3 flex justify-between" key={adjustment.id}>
            <span>{adjustment.description}</span>
            <span>{money(adjustment.amount, report.currency)}</span>
          </p>
        ))}
        <p className="mt-5 border-t border-white/10 pt-4 text-2xl">
          Netto proprietario:{" "}
          {money(Number(report.finalAmount) + adjustments, report.currency)}
        </p>
        <p className="mt-4 text-sm text-white/50">
          Importi salvati alla preparazione del rendiconto, comprensivi delle
          rettifiche.
        </p>
      </section>
    </Frame>
  );
}

export async function OwnerCalendar({
  propertyId,
  month: requestedMonth,
}: {
  propertyId?: string;
  month?: string;
}) {
  const owner = await requireRoles(["OWNER"]);
  const ids = await ownerScope();
  const now = new Date();
  const match = /^(20\d{2})-(0[1-9]|1[0-2])$/.exec(requestedMonth ?? "");
  const start = match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1))
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1),
  );
  const monthValue = start.toISOString().slice(0, 7);
  const properties = await prisma.property.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const selected = propertyId
    ? properties.find((item) => item.id === propertyId)
    : properties[0];
  if (propertyId && !selected) notFound();
  if (!selected)
    return (
      <Frame title="Calendario">
        <Empty>Nessuna struttura associata.</Empty>
      </Frame>
    );
  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        propertyId: selected.id,
        bookingStatus: { not: "CANCELLED" },
        checkIn: { lt: end },
        checkOut: { gt: start },
      },
      select: { id: true, checkIn: true, checkOut: true, channel: true },
    }),
    prisma.propertyAvailabilityBlock.findMany({
      where: {
        propertyId: selected.id,
        startDate: { lt: end },
        endDate: { gte: start },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        note: true,
        createdById: true,
      },
    }),
  ]);
  const offset = (start.getUTCDay() + 6) % 7;
  const days = Array.from(
    { length: new Date(end.getTime() - 86400000).getUTCDate() },
    (_, index) => new Date(start.getTime() + index * 86400000),
  );
  const adjacent = (offset: number) =>
    new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + offset, 1))
      .toISOString()
      .slice(0, 7);
  return (
    <Frame title="Calendario">
      <form className={`${card} flex flex-wrap items-end gap-4`} method="get">
        <label className="min-w-0 max-w-full text-sm">
          Struttura
          <select
            className="mt-2 block w-full min-w-0 max-w-full rounded-lg bg-[#152330] p-3"
            name="propertyId"
            defaultValue={selected.id}
          >
            {properties.map((item) => (
              <option value={item.id} key={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Mese
          <input
            className="mt-2 block rounded-lg bg-[#152330] p-3"
            type="month"
            name="month"
            defaultValue={monthValue}
          />
        </label>
        <button className="rounded-lg border border-[#D8B367]/40 px-5 py-3">
          Mostra
        </button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href={`/calendar?propertyId=${selected.id}&month=${adjacent(-1)}`}
        >
          ← Mese precedente
        </Link>
        <p>
          {start.toLocaleDateString("it-IT", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        </p>
        <Link href={`/calendar?propertyId=${selected.id}&month=${adjacent(1)}`}>
          Mese successivo →
        </Link>
      </div>
      <p className="text-sm text-white/60">
        Soggiorni anonimi e disponibilità della struttura. I giorni occupati
        escludono la data di check-out.
      </p>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((day) => (
          <p className="p-2 text-center text-xs text-white/60" key={day}>
            {day}
          </p>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <div key={`blank-${index}`} />
        ))}
        {days.map((day) => {
          const booking = bookings.find(
            (item) => item.checkIn <= day && item.checkOut > day,
          );
          const blocked = blocks.some(
            (item) => item.startDate <= day && item.endDate >= day,
          );
          return (
            <div
              className={`min-h-20 min-w-0 overflow-hidden rounded-lg border p-1 sm:min-h-24 sm:p-2 ${booking ? "border-[#D8B367]/70 bg-[#D8B367]/30 sm:border-[#D8B367]/40 sm:bg-[#D8B367]/10" : blocked ? "border-white/15 bg-white/10" : "border-emerald-400/50 bg-emerald-500/20 sm:border-white/10 sm:bg-transparent"}`}
              key={day.toISOString()}
            >
              <p>{day.getUTCDate()}</p>
              {booking ? (
                <Link
                  className="mt-2 block min-w-0 text-[9px] sm:text-xs"
                  href={`/bookings/${booking.id}`}
                  aria-label={`${ownerBookingLabel(booking.id)} · ${channelNames[booking.channel] ?? booking.channel}`}
                >
                  <span className="sm:hidden">Sogg.</span>
                  <span className="hidden break-words sm:block">{ownerBookingLabel(booking.id)}</span>
                  <span className="sr-only sm:not-sr-only sm:block sm:text-white/60">
                    {channelNames[booking.channel] ?? booking.channel}
                  </span>
                </Link>
              ) : (
                <p className="mt-2 text-[10px] text-white/60 sm:text-xs">
                  <span className="sm:hidden">{blocked ? "Blocco" : "Libero"}</span>
                  <span className="hidden sm:inline">{blocked ? "Non disponibile" : "Disponibile"}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
      <section className={card}>
        <h2 className="text-xl">Uso personale</h2>
        <p className="mt-2 text-sm text-white/60">
          Puoi riservare fino a 30 giorni per struttura e per anno, nei periodi
          disponibili. La data finale è inclusa.
        </p>
        <form
          action={reserveOwnerPersonalUse}
          className="mt-4 flex flex-wrap items-end gap-4"
        >
          <input type="hidden" name="propertyId" value={selected.id} />
          <label className="text-sm">
            Dal
            <input
              required
              type="date"
              name="startDate"
              min={now.toISOString().slice(0, 10)}
              className="mt-2 block rounded-lg bg-[#152330] p-3"
            />
          </label>
          <label className="text-sm">
            Al
            <input
              required
              type="date"
              name="endDate"
              min={now.toISOString().slice(0, 10)}
              className="mt-2 block rounded-lg bg-[#152330] p-3"
            />
          </label>
          <button className="rounded-lg border border-[#D8B367]/40 px-5 py-3">
            Riserva periodo
          </button>
        </form>
        {blocks
          .filter(
            (block) =>
              block.note === ownerPersonalUseNote &&
              block.createdById === owner.id,
          )
          .map((block) => (
            <div
              key={block.id}
              className="mt-4 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-4"
            >
              <p>
                {date(block.startDate)} – {date(block.endDate)}
              </p>
              {block.startDate >=
                new Date(`${now.toISOString().slice(0, 10)}T00:00:00.000Z`) && (
                <form action={releaseOwnerPersonalUse}>
                  <input type="hidden" name="propertyId" value={selected.id} />
                  <input type="hidden" name="blockId" value={block.id} />
                  <button className="text-sm text-[#D8B367]">
                    Libera il mio periodo
                  </button>
                </form>
              )}
            </div>
          ))}
      </section>
    </Frame>
  );
}
