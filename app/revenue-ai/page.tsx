import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";

import {
  getAccessiblePropertyIds,
  requireUser,
} from "@/lib/auth/guards";

import { prisma } from "@/lib/prisma";

import CalendarRevenueAiPage from "../calendar/revenue-ai/page";

type RevenueAiPageProps = {
  searchParams: Promise<{
    propertyId?: string | string[];
    from?: string | string[];
    to?: string | string[];
  }>;
};

function getParam(
  value: string | string[] | undefined,
) {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? "";
}

function formatDate(date: Date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default async function RevenueAiPage({
  searchParams,
}: RevenueAiPageProps) {
  await requireUser();

  const params =
    await searchParams;

  const requestedPropertyId =
    getParam(
      params.propertyId,
    );

  const requestedFrom =
    getParam(
      params.from,
    );

  const requestedTo =
    getParam(
      params.to,
    );

  const accessiblePropertyIds =
    await getAccessiblePropertyIds();

  const properties =
    await prisma.property.findMany({
      where:
        accessiblePropertyIds !== null
          ? {
              id: {
                in: accessiblePropertyIds,
              },
            }
          : undefined,

      orderBy: {
        name: "asc",
      },

      select: {
        id: true,
        name: true,
      },
    });

  if (properties.length === 0) {
    return (
      <>
        <Navigation />

        <AppShell
          title=""
          subtitle=""
        >
          <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600">
                Revenue AI
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-950">
                Nessuna struttura disponibile
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Crea o assegna una struttura prima di utilizzare Revenue AI.
              </p>

              <Link
                href="/dashboard"
                className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white"
              >
                Torna alla dashboard
              </Link>
            </div>
          </main>
        </AppShell>
      </>
    );
  }

  const propertyId =
    properties.some(
      (property) =>
        property.id ===
        requestedPropertyId,
    )
      ? requestedPropertyId
      : properties[0].id;

  if (
    !requestedPropertyId ||
    !requestedFrom ||
    !requestedTo ||
    propertyId !==
      requestedPropertyId
  ) {
    const now =
      new Date();

    const monthStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      );

    const monthEnd =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      );

    const from =
      requestedFrom ||
      formatDate(
        monthStart,
      );

    const to =
      requestedTo ||
      formatDate(
        monthEnd,
      );

    redirect(
      `/revenue-ai?propertyId=${encodeURIComponent(
        propertyId,
      )}&from=${from}&to=${to}`,
    );
  }

  return CalendarRevenueAiPage({
    searchParams:
      Promise.resolve({
        propertyId,
        from: requestedFrom,
        to: requestedTo,
        workspace: "1",
      }),
  });
}
