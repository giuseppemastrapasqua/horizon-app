import { Prisma } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { requireRoles } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { accountingSchema, initialAccounting } from "@/lib/business-accounting/config";
import { AccountingWorkspace } from "./AccountingWorkspace";

export default async function BusinessAccountingPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const user = await requireRoles(["SUPER_ADMIN"]);
  const params = await searchParams;
  const currentYear = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Europe/Rome" }).format(new Date()));
  const candidate = Number(params.year ?? currentYear);
  const year = Number.isInteger(candidate) && candidate >= 2020 && candidate <= 2100 ? candidate : currentYear;
  let record;
  let unavailable = false;
  try {
    record = await prisma.businessAccounting.findUnique({ where: { userId_year: { userId: user.id, year } }, select: { config: true, version: true } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") unavailable = true;
    else throw error;
  }
  const parsed = record ? accountingSchema.safeParse(record.config) : null;
  return <><Navigation /><AppShell title="La mia attività" subtitle="Contabilità e netto · ditta individuale in regime forfettario">
    {unavailable ? <p role="alert">La contabilità è in preparazione: occorre completare l’aggiornamento del database.</p> :
      parsed && !parsed.success ? <p role="alert">Dati salvati non leggibili. Contatta l’amministratore prima di modificarli.</p> :
        <AccountingWorkspace key={year} year={year} initial={parsed?.success ? parsed.data : initialAccounting} initialVersion={record?.version ?? 0} />}
  </AppShell></>;
}
