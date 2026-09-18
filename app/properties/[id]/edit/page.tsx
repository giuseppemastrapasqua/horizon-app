import { notFound } from "next/navigation";

import {
  PropertyTaskAssignmentRole,
  RecordStatus,
} from "@prisma/client";

import { AppShell } from "@/components/AppShell";
import { Navigation } from "@/components/Navigation";
import { PropertyAmenitiesSection } from "@/components/properties/PropertyAmenitiesSection";
import { PropertyCheckInSection } from "@/components/properties/PropertyCheckInSection";
import { PropertyCodeSection } from "@/components/properties/PropertyCodeSection";
import { PropertyDocumentsSection } from "@/components/properties/PropertyDocumentsSection";
import { PropertyHouseRulesSection } from "@/components/properties/PropertyHouseRulesSection";
import { PropertyPhotosSection } from "@/components/properties/PropertyPhotosSection";
import { ActionButton } from "@/components/ui/ActionButton";
import { WorkspaceTopBar } from "@/components/ui/WorkspaceTopBar";
import { PropertyIntegrationsSection } from "@/components/properties/PropertyIntegrationsSection";
import { PropertyIcalExportSection } from "@/components/properties/PropertyIcalExportSection";
import { PropertyAlloggiatiCredentialsSection } from "@/components/properties/PropertyAlloggiatiCredentialsSection";
import { PropertyChannelPricingSettings } from "@/components/properties/PropertyChannelPricingSettings";
import { getPropertyChannelPricingSettings } from "@/lib/pricing/get-property-channel-pricing-settings";
import { getPropertyWorkspace } from "@/lib/properties/get-property-workspace";
import { PropertyCodeVerificationHistory } from "@/components/properties/PropertyCodeVerificationHistory";
import { prisma } from "@/lib/prisma";
import { hasPropertyRole, requirePropertyAccess } from "@/lib/auth/guards";
import { PropertyAccessSection } from "@/components/properties/PropertyAccessSection";
import { PropertyOwnerInvitesSection } from "@/components/properties/PropertyOwnerInvitesSection";
import { updatePropertyAccessAction } from "./property-access-actions";
import {
  archivePropertyAction,
  permanentlyDeletePropertyAction,
} from "./property-lifecycle-actions";
import { PropertyFinanceReportSettings } from "@/components/properties/PropertyFinanceReportSettings";
import {
  resetFinanceReportTemplateAction,
  updateFinanceReportTemplateAction,
} from "./finance-report-template-actions";

import { updatePropertyAmenitiesAction } from "./amenity-actions";
import { updatePropertyTaskAssignmentsAction } from "./task-assignment-actions";
import {
  synchronizePropertyIntegrationAction,
  updatePropertyIntegrationAction,
} from "./integration-actions";
import {
  discoverAlloggiatiApartmentsAction,
  linkExistingAlloggiatiAccountAction,
  listAlloggiatiApartmentsAction,
  saveAlloggiatiCredentialsAction,
} from "./alloggiati-credential-actions";
import { updatePropertyChannelPricingAction } from "./channel-pricing-actions";
import { updatePropertyAction } from "./actions";
import { updatePropertyRatePlanAction } from "./rate-plan-actions";
import { updatePropertyCheckInAction } from "./check-in-actions";
import { updatePropertyHouseRulesAction } from "./house-rule-actions";
import {
  deletePropertyImageAction,
  reorderPropertyImagesAction,
  setPropertyCoverImageAction,
  uploadPropertyImageAction,
} from "./photo-actions";
import { updatePropertyCodesAction } from "./property-code-actions";
import {
  createPropertyDocumentAction,
  deletePropertyDocumentAction,
  retryPropertyDocumentOcrAction,
  updatePropertyDocumentAction,
} from "./property-document-actions";

type PropertyEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const revenueAiCapabilities = [
  "Dynamic pricing",
  "Rilevamento eventi",
  "Analisi dei competitor",
  "Previsione dell'occupazione",
  "Sconti automatici",
  "Ottimizzazione del soggiorno minimo",
];

export default async function PropertyEditPage({
  params,
}: PropertyEditPageProps) {
  const { id } = await params;

  const currentUser = await requirePropertyAccess(id);
  if (currentUser.role === "OPERATOR") {
    throw new Error("Accesso non autorizzato.");
  }

  const canManageProperty = await hasPropertyRole(
    id,
    ["OWNER", "MANAGER"],
  );

  const workspace = await getPropertyWorkspace(id);

  const [activeUsers, taskAssignments] = canManageProperty
    ? await Promise.all([
        prisma.user.findMany({
          where: {
            status: RecordStatus.ACTIVE,
          },
          orderBy: {
            fullName: "asc",
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        }),

        prisma.propertyTaskAssignment.findMany({
          where: {
            propertyId: id,
            active: true,
          },
          select: {
            role: true,
            userId: true,
          },
        }),
      ])
    : [[], []];
  if (!workspace) {
    notFound();
  }

  const [accessUsers, propertyAccesses, propertyOwnerInvites] =
    currentUser.role === "SUPER_ADMIN"
      ? await Promise.all([
          prisma.user.findMany({
            where: {
              status: RecordStatus.ACTIVE,
              role: {
                not: "SUPER_ADMIN",
              },
            },
            orderBy: {
              fullName: "asc",
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
            },
          }),

          prisma.propertyAccess.findMany({
            where: {
              propertyId: id,
              active: true,
            },
            orderBy: {
              createdAt: "asc",
            },
            select: {
              userId: true,
              role: true,
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                },
              },
            },
          }),

          prisma.propertyOwnerInvite.findMany({
            where: {
              propertyId: id,
              revokedAt: null,
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              fullName: true,
              email: true,
              expiresAt: true,
              acceptedAt: true,
              revokedAt: true,
              createdAt: true,
            },
          }),
        ])
      : [[], [], []];

  const ownerBillingProfile =
    currentUser.role === "SUPER_ADMIN"
      ? await prisma.ownerBillingProfile.findUnique({
          where: { ownerId: workspace.property.owner.id },
          select: {
            entityType: true,
            firstName: true,
            lastName: true,
            businessName: true,
            taxCode: true,
            vatNumber: true,
            address: true,
            postalCode: true,
            city: true,
            province: true,
            country: true,
            email: true,
            pec: true,
            recipientCode: true,
          },
        })
      : null;

  const {
    property,
    propertyDocuments,
    revenueRatePlan,
  } = workspace;

  const [
    alloggiatiConnection,
    alloggiatiAccounts,
  ] =
    currentUser.role === "SUPER_ADMIN"
      ? await Promise.all([
          prisma.alloggiatiWebProperty.findUnique({
            where: {
              propertyId: property.id,
            },
            select: {
              apartmentId: true,
              updatedAt: true,
              account: {
                select: {
                  name: true,
                },
              },
            },
          }),

          prisma.alloggiatiWebAccount.findMany({
            where: {
              ownerId: property.owner.id,
            },
            orderBy: {
              name: "asc",
            },
            select: {
              id: true,
              name: true,
            },
          }),
        ])
      : [null, []];
  const [
    propertyFinanceTemplate,
    defaultFinanceTemplate,
  ] = await Promise.all([
    prisma.financeReportTemplate.findUnique({
      where: {
        propertyId: property.id,
      },
    }),

    prisma.financeReportTemplate.findFirst({
      where: {
        propertyId: null,
        isDefault: true,
      },

      orderBy: {
        createdAt: "asc",
      },
    }),
  ]);

  if (!defaultFinanceTemplate) {
    throw new Error(
      "Template Horizon Default non disponibile."
    );
  }

  const effectiveFinanceTemplate =
    propertyFinanceTemplate ??
    defaultFinanceTemplate;
  const cleaningUserId =
    taskAssignments.find(
      (assignment) =>
        assignment.role ===
        PropertyTaskAssignmentRole.CLEANING,
    )?.userId ?? "";

  const maintenanceUserId =
    taskAssignments.find(
      (assignment) =>
        assignment.role ===
        PropertyTaskAssignmentRole.MAINTENANCE,
    )?.userId ?? "";

  const operationsUserId =
    taskAssignments.find(
      (assignment) =>
        assignment.role ===
        PropertyTaskAssignmentRole.OPERATIONS,
    )?.userId ?? "";

  return (
    <>
      <Navigation />

      <AppShell
      title={`Scheda immobile \u00B7 ${property.name}`}
        subtitle="Gestisci tutte le informazioni operative e pubbliche dell'immobile."
      >
        <div className="property-edit-theme mx-auto max-w-6xl space-y-8">
          <WorkspaceTopBar
            backLabel="Torna alla scheda immobile"
            backHref={`/properties/${property.id}`}
            actions={
              <ActionButton
                label="Nuova prenotazione"
                href={`/bookings/new?propertyId=${property.id}`}
                variant="secondary"
              />
            }
          />

          <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#09131C]/95 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0D1923] via-[#09131C] to-[#07111A] px-8 py-10 text-[#FFF8EA]">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-4 flex flex-wrap gap-3">
                    <span className="rounded-full bg-[#D8B367]/[0.08] px-3 py-1 text-xs font-medium text-[#D8B367] ring-1 ring-inset ring-[#D8B367]/20">
                      Scheda immobile
                    </span>

                    <span className="rounded-full bg-emerald-400/[0.08] px-3 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                      Configurazione attiva
                    </span>
                  </div>

                  <h1 className="text-4xl font-semibold tracking-[-0.025em] text-[#FFF8EA] [font-family:Georgia,Cambria,Times_New_Roman,serif]">
                    {property.name}
                  </h1>

                  <p className="mt-3 text-[#8EA0AE]">
                    {property.address}
                  </p>
                </div>

                <div className="max-w-md rounded-2xl border border-[#D8B367]/20 bg-[#07111A]/70 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.14)] backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#D8B367]">
                    Revenue Engine
                  </p>

                  <p className="mt-2 text-lg font-semibold text-[#FFF8EA]">
                    Prezzo gestito dall&apos;AI
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#8EA0AE]">
                {"Horizon ottimizzer\u00E0 automaticamente la tariffa considerando"}
                {"domanda, eventi, stagionalit\u00E0 e performance"}
                    dell&apos;immobile.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid border-t border-white/[0.07] bg-[#07111A]/65 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-white/[0.07] [&>div]:px-6 [&>div]:py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6F7E8A]">
                  Stato
                </p>

                <p className="mt-2 font-semibold text-emerald-300">
                  Attivo
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6F7E8A]">
                  Marketplace
                </p>

                <p className="mt-2 font-semibold text-[#FFF8EA]">
                  In preparazione
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6F7E8A]">
                  Revenue AI
                </p>

                <p className="mt-2 font-semibold text-[#FFF8EA]">
                  Automatico
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6F7E8A]">
                  Configurazione
                </p>

                <p className="mt-2 font-semibold text-[#FFF8EA]">
                  Dati principali
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#FFF8EA]">
                Configurazione immobile
              </h2>

              <p className="mt-1 text-sm text-[#82909C]">
                Completa progressivamente tutte le aree necessarie alla
                gestione e alla futura pubblicazione.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <a
                href="#informazioni"
                className="rounded-2xl border border-[#D8B367]/40 bg-[#D8B367]/[0.08] p-5 text-[#FFF8EA] shadow-sm transition hover:-translate-y-0.5 hover:border-[#D8B367]/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8B367] text-sm font-semibold text-[#07111A]">
                    01
                  </span>

                  <span className="rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-medium text-emerald-200">
                    Attiva
                  </span>
                </div>

                <p className="mt-6 font-semibold">
                  Informazioni
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Dati pubblici e operativi.
                </p>
              </a>

              <a
                href="#foto"
                className="rounded-2xl border border-white/[0.07] bg-[#09131C]/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D8B367]/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8B367]/[0.08] text-sm font-semibold text-[#D8B367] ring-1 ring-inset ring-[#D8B367]/15">
                    02
                  </span>

                  <span className="rounded-full bg-emerald-400/[0.08] px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                    Attiva
                  </span>
                </div>

                <p className="mt-6 font-semibold text-[#FFF8EA]">
                  Foto
                </p>

                <p className="mt-1 text-xs leading-5 text-[#82909C]">
                  Galleria e copertina.
                </p>
              </a>

              <a
                href="#servizi"
                className="rounded-2xl border border-white/[0.07] bg-[#09131C]/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D8B367]/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8B367]/[0.08] text-sm font-semibold text-[#D8B367] ring-1 ring-inset ring-[#D8B367]/15">
                    03
                  </span>

                  <span className="rounded-full bg-emerald-400/[0.08] px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                    Attiva
                  </span>
                </div>

                <p className="mt-6 font-semibold text-[#FFF8EA]">
                  Servizi
                </p>

                <p className="mt-1 text-xs leading-5 text-[#82909C]">
                  Dotazioni, comfort e caratteristiche della struttura.
                </p>
              </a>

              <a
                href="#documentazione"
                className="rounded-2xl border border-white/[0.07] bg-[#09131C]/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D8B367]/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8B367]/[0.08] text-sm font-semibold text-[#D8B367] ring-1 ring-inset ring-[#D8B367]/15">
                    04
                  </span>

                  <span className="rounded-full bg-emerald-400/[0.08] px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-400/20">
                    Attiva
                  </span>
                </div>

                <p className="mt-6 font-semibold text-[#FFF8EA]">
                  Documenti
                </p>

                <p className="mt-1 text-xs leading-5 text-[#82909C]">
                  Licenze e certificazioni.
                </p>
              </a>

              <a
                href="#revenue-ai"
                className="rounded-2xl border border-[#D8B367]/20 bg-[#09131C]/95 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D8B367]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8B367]/[0.10] text-sm font-semibold text-[#D8B367] ring-1 ring-inset ring-[#D8B367]/20">
                    AI
                  </span>

                  <span className="rounded-full bg-[#D8B367]/[0.10] px-2.5 py-1 text-xs font-medium text-[#D8B367] ring-1 ring-inset ring-[#D8B367]/20">
                    Automatico
                  </span>
                </div>

                <p className="mt-6 font-semibold text-[#FFF8EA]">
                  Revenue AI
                </p>

                <p className="mt-1 text-xs leading-5 text-[#82909C]">
                  Prezzi e strategie ottimizzati da Horizon.
                </p>
              </a>

              <div className="rounded-2xl border border-white/[0.07] bg-[#09131C]/95 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8B367]/[0.08] text-sm font-semibold text-[#D8B367] ring-1 ring-inset ring-[#D8B367]/15">
                    06
                  </span>

                  <span className="rounded-full bg-amber-400/[0.08] px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-400/20">
                    In preparazione
                  </span>
                </div>

                <p className="mt-6 font-semibold text-[#FFF8EA]">
                  Marketplace
                </p>

                <p className="mt-1 text-xs leading-5 text-[#82909C]">
                  {"Pubblicazione e visibilit\u00E0."}
                </p>
              </div>
            </div>
          </section>

          <section
            id="informazioni"
            className="scroll-mt-8 rounded-3xl border border-white/[0.07] bg-[#09131C]/95 p-8 shadow-[0_18px_50px_rgba(0,0,0,0.16)]"
          >
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8B367] text-sm font-semibold text-[#07111A]">
                  01
                </span>

                <div>
                  <h2 className="text-2xl font-semibold text-[#FFF8EA]">
                    Informazioni generali
                  </h2>

                  <p className="mt-1 text-sm text-[#82909C]">
              {"Identit\u00E0, contenuti pubblici e dati operativi."}
                  </p>
                </div>
              </div>
            </div>

            <form
              action={updatePropertyAction}
              className="space-y-8"
            >
              <input
                type="hidden"
                name="propertyId"
                value={property.id}
              />

              <div className="grid gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-[#C8D0D6]"
                  >
                    Nome immobile
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    defaultValue={property.name}
                    className="w-full rounded-xl border border-white/[0.10] bg-[#07111A] px-4 py-3 text-[#FFF8EA] outline-none transition placeholder:text-[#56636E] focus:border-[#D8B367]/70 focus:ring-2 focus:ring-[#D8B367]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="mb-2 block text-sm font-medium text-[#C8D0D6]"
                  >
                    Indirizzo
                  </label>

                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    defaultValue={property.address}
                    className="w-full rounded-xl border border-white/[0.10] bg-[#07111A] px-4 py-3 text-[#FFF8EA] outline-none transition placeholder:text-[#56636E] focus:border-[#D8B367]/70 focus:ring-2 focus:ring-[#D8B367]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-[#C8D0D6]"
                  >
                    Descrizione pubblica
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={8}
                    defaultValue={property.description ?? ""}
                    className="w-full resize-y rounded-xl border border-white/[0.10] bg-[#07111A] px-4 py-3 text-[#FFF8EA] outline-none transition placeholder:text-[#56636E] focus:border-[#D8B367]/70 focus:ring-2 focus:ring-[#D8B367]/10"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {"Questo contenuto potr\u00E0 essere ottimizzato automaticamente"}
                    dall&apos;AI per il marketplace.
                  </p>
                </div>
              </div>

              <div>
                <div className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#09131C]/95 shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
  <div className="flex flex-col gap-5 border-b border-slate-200 bg-slate-50/70 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex items-start gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-7 w-7">
          <path d="M3.75 7.5 7.5 11l4.5-6 4.5 6 3.75-3.5-1.5 9.5H6.25L3.75 7.5Z" fill="currentColor" />
          <path d="M6 20h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-xl font-semibold tracking-tight text-slate-950">{"Operativit\u00E0"}</h3>
          <span className="rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-sm">Premium</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Informazioni utilizzate internamente dal gestionale Horizon e non mostrate agli ospiti.
        </p>
      </div>
    </div>

    <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5">
          <path d="m12 3 7 5-7 13L5 8l7-5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M5 8h14M9 3l3 5 3-5M9 8l3 13 3-13" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-blue-700">{"Funzionalit\u00E0 Premium"}</p>
        <p className="mt-0.5 text-xs text-slate-500">Gestione avanzata della struttura</p>
      </div>
    </div>
  </div>

  <div className="px-6 py-7">
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Ospiti inclusi nel prezzo base Revenue AI
        </label>
        <div className="w-full rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3.5 text-base font-semibold text-blue-900">
          2 ospiti
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Il prezzo base Revenue AI viene sempre calcolato per 2 ospiti.
        </p>
      </div>

      <div>
        <label htmlFor="extraGuestFee" className="mb-2 block text-sm font-semibold text-slate-700">
          Supplemento per ospite aggiuntivo (€ / notte)
        </label>
        <input
          id="extraGuestFee"
          name="extraGuestFee"
          type="number"
          min="0"
          step="0.01"
          required
          defaultValue={Number(property.extraGuestFee)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Applicato per ogni ospite oltre i 2 inclusi nel prezzo base.
        </p>
      </div>

      <div>
        <label htmlFor="cleaningCost" className="mb-2 block text-sm font-semibold text-slate-700">{"Costo pulizia per prenotazione (\u20AC)"}</label>
        <input id="cleaningCost" name="cleaningCost" type="number" min="0" step="0.01" required defaultValue={Number(property.cleaningCost)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10" />
        <p className="mt-2 text-xs leading-5 text-slate-500">Costo fisso applicato alla pulizia tra un soggiorno e l'altro.</p>
      </div>

      <div>
        <label htmlFor="propertyManagementCommissionPercent" className="mb-2 block text-sm font-semibold text-slate-700">Commissione Property Manager (%)</label>
        <input id="propertyManagementCommissionPercent" name="propertyManagementCommissionPercent" type="number" min="0" max="99.99" step="0.01" required defaultValue={Number(property.propertyManagementCommissionPercent)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10" />
        <p className="mt-2 text-xs leading-5 text-slate-500">Percentuale di commissione riconosciuta al Property Manager.</p>
      </div>

      <div>
        <label htmlFor="propertyManagementCommissionVatPercent" className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
          IVA commissione (%)
          <span title="Aliquota IVA applicata alla commissione del Property Manager" className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-bold text-slate-500">i</span>
        </label>
        <input id="propertyManagementCommissionVatPercent" name="propertyManagementCommissionVatPercent" type="number" min="0" max="99.99" step="0.01" required defaultValue={Number(property.propertyManagementCommissionVatPercent)} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10" />
        <p className="mt-2 text-xs leading-5 text-slate-500">Aliquota IVA applicata alla commissione.</p>
      </div>

      <div>
        <label htmlFor="propertyManagementCommissionVatMode" className="mb-2 block text-sm font-semibold text-slate-700">{"Modalit\u00E0 IVA commissione"}</label>
        <select id="propertyManagementCommissionVatMode" name="propertyManagementCommissionVatMode" defaultValue={property.propertyManagementCommissionVatMode} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-950 shadow-sm outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10">
          <option value="NONE">Nessuna IVA</option>
          <option value="EXCLUDED">IVA in aggiunta</option>
          <option value="INCLUDED">IVA compresa</option>
        </select>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{"Definisce se l'IVA \u00E8 assente, aggiunta alla commissione o gi\u00E0 compresa."}</p>
      </div>
    </div>

    <div className="mt-7 flex gap-4 rounded-2xl border border-white/[0.08] bg-[#07111A]/80 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#38BDF8]/20 bg-[#38BDF8]/10 text-sm font-bold text-[#38BDF8]">i</div>
      <div>
        <p className="text-sm font-semibold text-[#FFF8EA]">Nota</p>
        <p className="mt-1 text-sm leading-6 text-[#8EA0AE]">
          Questi dati sono utilizzati per i calcoli finanziari e per la generazione di rendiconti e fatture ai proprietari. Le informazioni in questa sezione non sono visibili agli ospiti.
        </p>
      </div>
    </div>
  </div>
</div>
              </div>
              <div className="flex justify-end border-t border-slate-200 pt-6">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Salva modifiche
                </button>
              </div>
            </form>
          </section>

          {currentUser.role === "SUPER_ADMIN" && (
            <>
              <PropertyOwnerInvitesSection
                propertyId={property.id}
                ownerBillingProfile={ownerBillingProfile}
                activeOwners={propertyAccesses
                  .filter((access) => access.role === "OWNER")
                  .map((access) => ({
                    userId: access.userId,
                    email: access.user.email,
                    isSuperAdmin: access.user.role === "SUPER_ADMIN",
                  }))}
                invites={propertyOwnerInvites.map((invite) => ({
                  ...invite,
                  expiresAt: invite.expiresAt.toISOString(),
                  acceptedAt: invite.acceptedAt?.toISOString() ?? null,
                  revokedAt: invite.revokedAt?.toISOString() ?? null,
                  createdAt: invite.createdAt.toISOString(),
                }))}
              />

              <PropertyAccessSection
                propertyId={property.id}
                users={accessUsers}
                accesses={propertyAccesses}
                updateAction={updatePropertyAccessAction}
              />
            </>
          )}


          {canManageProperty && (
          <section

            id="responsabili-operativi"
            className="scroll-mt-8 rounded-3xl border border-white/[0.07] bg-[#09131C]/95 p-8 shadow-[0_18px_50px_rgba(0,0,0,0.16)]"
          >
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8B367] text-sm font-semibold text-[#07111A]">
                  02
                </span>

                <div>
                  <h2 className="text-2xl font-semibold text-[#FFF8EA]">
                    Responsabili operativi
                  </h2>

                  <p className="mt-1 text-sm text-[#82909C]">
              {"Horizon assegner\u00E0 automaticamente i task alla persona configurata per ciascuna funzione."}
                  </p>
                </div>
              </div>
            </div>

            <form
              action={updatePropertyTaskAssignmentsAction}
              className="space-y-6"
            >
              <input
                type="hidden"
                name="propertyId"
                value={property.id}
              />

              <div className="grid gap-5 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#C8D0D6]">
                    Pulizie
                  </span>

                  <select
                    name="cleaningUserId"
                    defaultValue={cleaningUserId}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      Nessun responsabile
                    </option>

                    {activeUsers.map(
                      (user) => (
                        <option
                          key={user.id}
                          value={user.id}
                        >
                          {user.fullName} {"\u00B7"} {user.email}
                        </option>
                      ),
                    )}
                  </select>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Riceve automaticamente i task di pulizia.
                  </p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#C8D0D6]">
                    Manutenzione
                  </span>

                  <select
                    name="maintenanceUserId"
                    defaultValue={maintenanceUserId}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      Nessun responsabile
                    </option>

                    {activeUsers.map(
                      (user) => (
                        <option
                          key={user.id}
                          value={user.id}
                        >
                          {user.fullName} {"\u00B7"} {user.email}
                        </option>
                      ),
                    )}
                  </select>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Riceve automaticamente manutenzioni e interventi tecnici.
                  </p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-[#C8D0D6]">
                    Operations / PM
                  </span>

                  <select
                    name="operationsUserId"
                    defaultValue={operationsUserId}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
                  >
                    <option value="">
                      Nessun responsabile
                    </option>

                    {activeUsers.map(
                      (user) => (
                        <option
                          key={user.id}
                          value={user.id}
                        >
                          {user.fullName} {"\u00B7"} {user.email}
                        </option>
                      ),
                    )}
                  </select>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
              {"Riceve check-in, check-out, documenti ospite, issue e attivit\u00E0 amministrative."}
                  </p>
                </label>
              </div>

              <div className="rounded-2xl border border-[#D8B367]/15 bg-[#07111A]/80 px-5 py-4">
                <p className="text-sm font-medium text-[#FFF8EA]">
              {"Una sola persona pu\u00F2 essere responsabile di tutte le funzioni."}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#D8B367]">
                  Puoi selezionare lo stesso utente in Pulizie, Manutenzione e Operations.
                </p>
              </div>

              <div className="flex justify-end border-t border-slate-200 pt-6">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Salva responsabili
                </button>
              </div>
            </form>
          </section>
          )}
          <PropertyCodeSection
            propertyId={property.id}
            cin={property.cin}
            cir={property.cir}
            verificationStatus={
              property.codeVerificationStatus
            }
            verifiedAt={property.codeVerifiedAt}
            verificationNotes={
              property.codeVerificationNotes
            }
            updateAction={updatePropertyCodesAction}
          />

    <PropertyCodeVerificationHistory
  verifications={
    property.propertyCodeVerifications
  }
/>

<PropertyIcalExportSection
  propertyId={property.id}
/>
<PropertyIntegrationsSection
  propertyId={property.id}
  mappings={workspace.integrationMappings}
  updateAction={
    updatePropertyIntegrationAction
  }
  synchronizeAction={
    synchronizePropertyIntegrationAction
  }
/>

{currentUser.role === "SUPER_ADMIN" ? (
  <PropertyAlloggiatiCredentialsSection
    propertyId={property.id}
    connection={
      alloggiatiConnection
        ? {
            accountName:
              alloggiatiConnection.account.name,
            apartmentId:
              alloggiatiConnection.apartmentId,
            updatedAt:
              alloggiatiConnection.updatedAt,
          }
        : null
    }
    accounts={alloggiatiAccounts}
    createAccountAction={
      saveAlloggiatiCredentialsAction
    }
    linkAccountAction={
      linkExistingAlloggiatiAccountAction
    }
    listApartmentsAction={
      listAlloggiatiApartmentsAction
    }
    discoverApartmentsAction={
      discoverAlloggiatiApartmentsAction
    }
  />
) : null}

<PropertyChannelPricingSettings
  propertyId={property.id}
  settings={
    await getPropertyChannelPricingSettings(
      property.id,
    )
  }
  updateAction={
    updatePropertyChannelPricingAction
  }
/>
          <PropertyPhotosSection
            propertyId={property.id}
            images={property.images}
            uploadAction={uploadPropertyImageAction}
            deleteAction={deletePropertyImageAction}
            coverAction={setPropertyCoverImageAction}
            reorderAction={reorderPropertyImagesAction}
          />

          <PropertyHouseRulesSection
            propertyId={property.id}
            houseRules={workspace.houseRules}
            selectedHouseRuleIds={property.houseRuleIds}
            updateAction={updatePropertyHouseRulesAction}
          />

          <PropertyCheckInSection
            propertyId={property.id}
            checkInConfiguration={property.checkInConfiguration}
            updateAction={updatePropertyCheckInAction}
          />

          <PropertyAmenitiesSection
            propertyId={property.id}
            amenities={workspace.amenities}
            selectedAmenityIds={property.amenityIds}
            updateAction={updatePropertyAmenitiesAction}
          />

          <PropertyDocumentsSection
  propertyId={property.id}
  documents={propertyDocuments}
  createAction={createPropertyDocumentAction}
  updateAction={updatePropertyDocumentAction}
  deleteAction={deletePropertyDocumentAction}
  retryOcrAction={retryPropertyDocumentOcrAction}
/>
<PropertyFinanceReportSettings
  propertyId={property.id}
  template={effectiveFinanceTemplate}
  isCustomized={Boolean(
    propertyFinanceTemplate
  )}
  updateAction={
    updateFinanceReportTemplateAction
  }
  resetAction={
    resetFinanceReportTemplateAction
  }
/>

<section
            id="revenue-ai"
            className="scroll-mt-8 overflow-hidden rounded-3xl border border-[#D8B367]/20 bg-[#09131C]/95 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
          >
            <div className="border-b border-white/[0.07] bg-gradient-to-br from-[#0D1923] via-[#09131C] to-[#07111A] px-8 py-8 text-[#FFF8EA]">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D8B367]/[0.10] text-sm font-semibold text-[#D8B367] ring-1 ring-inset ring-[#D8B367]/20">
                      AI
                    </span>

                    <div>
                      <h2 className="text-2xl font-semibold">
                        Revenue AI
                      </h2>

                      <p className="mt-1 text-sm text-[#8EA0AE]">
              {"Ottimizza prezzi e disponibilit\u00E0 sulla base dei dati della struttura."}
                      </p>
                    </div>
                  </div>

                  <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-300">
              {"Horizon analizzer\u00E0 mercato, domanda, stagionalit\u00E0, eventi"}
                    e andamento delle prenotazioni per determinare
              {"automaticamente la tariffa pi\u00F9 efficace."}
                  </p>
                </div>

                <span className="w-fit rounded-full bg-amber-300/15 px-3 py-1.5 text-xs font-medium text-amber-200 ring-1 ring-inset ring-amber-200/20">
                  In sviluppo
                </span>
              </div>
            </div>

            <div className="grid gap-8 p-8 lg:grid-cols-[1fr_320px]">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  {"Funzionalit\u00E0 previste"}
                </h3>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {revenueAiCapabilities.map((capability) => (
                    <div
                      key={capability}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                        {"\u2713"}
                      </span>

                      <span className="text-sm font-medium text-slate-800">
                        {capability}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-2xl border border-[#D8B367]/20 bg-[#07111A]/80 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#D8B367]">
                  Controllo umano
                </p>

                <h3 className="mt-3 text-lg font-semibold text-[#FFF8EA]">
                  Automazione trasparente
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
              {"Ogni decisione del Revenue Engine sar\u00E0 accompagnata da una"}
                  motivazione chiara. Il gestore mantiene sempre il controllo finale.
                </p>

                <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#09131C] p-4">
                  <p className="text-xs text-slate-500">
                    Baseline tariffaria
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {revenueRatePlan
                  ? `${revenueRatePlan.basePrice} \u20AC \u00B7 ${revenueRatePlan.name}`
                      : "Da configurare"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {revenueRatePlan
                  ? `Min ${revenueRatePlan.minimumStay} notti \u00B7 ${revenueRatePlan.occupancyIncluded} ospiti inclusi`
                      : "Configura una tariffa base ufficiale per attivare il Revenue Engine."}
                  </p>
                </div>
              </aside>
            </div>

            <div className="border-t border-white/[0.07] bg-[#07111A]/55 p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#FFF8EA]">
                  Piano tariffario base
                </h3>

                <p className="mt-1 text-sm text-[#82909C]">
                  Definisce la baseline ufficiale della struttura. Gli override del calendario restano separati.
                </p>
              </div>

              <form
                action={updatePropertyRatePlanAction}
                className="grid gap-5 md:grid-cols-2 xl:grid-cols-5"
              >
                <input
                  type="hidden"
                  name="propertyId"
                  value={property.id}
                />

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Nome piano
                  </label>
                  <input
                    name="name"
                    required
                    defaultValue={revenueRatePlan?.name ?? "Standard"}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    {"Tariffa base \u20AC"}
                  </label>
                  <input
                    name="basePrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    defaultValue={revenueRatePlan?.basePrice ?? ""}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Min. notti
                  </label>
                  <input
                    name="minimumStay"
                    type="number"
                    min="1"
                    step="1"
                    required
                    defaultValue={revenueRatePlan?.minimumStay ?? 1}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Max. notti
                  </label>
                  <input
                    name="maximumStay"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={revenueRatePlan?.maximumStay ?? ""}
                    placeholder="Nessun limite"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Ospiti inclusi
                  </label>
                  <input
                    name="occupancyIncluded"
                    type="number"
                    min="1"
                    step="1"
                    required
                    defaultValue={revenueRatePlan?.occupancyIncluded ?? 1}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="md:col-span-2 xl:col-span-5 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
                  >
                    Salva piano tariffario
                  </button>
                </div>
              </form>
            </div>
          </section>
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-8 py-6">
              <h2 className="text-xl font-semibold text-slate-950">
                Stato struttura
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Archivia la struttura mantenendo dati, configurazioni e storico operativo.
              </p>
            </div>

            <div className="p-8">
              <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Stato attuale
                  </p>

                  <p className="mt-1 text-sm text-[#82909C]">
                    {property.status === "ARCHIVED"
                ? "La struttura \u00E8 archiviata."
                : `La struttura \u00E8 attualmente ${property.status.toLowerCase()}.`}
                  </p>
                </div>

                {property.status !== "ARCHIVED" && (
                  <form action={archivePropertyAction}>
                    <input
                      type="hidden"
                      name="propertyId"
                      value={property.id}
                    />

                    <button
                      type="submit"
                      className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                    >
                      Archivia struttura
                    </button>
                  </form>
                )}
              </div>

              {currentUser.role === "SUPER_ADMIN" && (
                <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
                    Zona pericolosa
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-[#FFF8EA] text-red-950">
                    Eliminazione definitiva
                  </h3>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-red-800">
                    Disponibile solo per strutture archiviate e senza storico operativo
                protetto. L&apos;operazione non pu\u00F2 essere annullata.
                  </p>

                  {property.status === "ARCHIVED" ? (
                    <form
                      action={permanentlyDeletePropertyAction}
                      className="mt-5 max-w-xl"
                    >
                      <input
                        type="hidden"
                        name="propertyId"
                        value={property.id}
                      />

                      <label className="block text-sm font-medium text-red-950">
                        Per confermare, scrivi esattamente:
                        <span className="ml-1 font-bold">
                          {property.name}
                        </span>
                      </label>

                      <input
                        name="confirmation"
                        required
                        autoComplete="off"
                        className="mt-3 w-full rounded-xl border border-red-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                      />

                      <button
                        type="submit"
                        className="mt-4 rounded-xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800"
                      >
                        Elimina definitivamente
                      </button>
                    </form>
                  ) : (
                    <p className="mt-4 text-sm font-medium text-red-800">
                      Archivia prima la struttura per abilitare questa operazione.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
        <style>{`
          .property-edit-theme .bg-white {
            background-color: #09131C !important;
          }

          .property-edit-theme .bg-slate-50,
          .property-edit-theme .bg-slate-100 {
            background-color: #07111A !important;
          }

          .property-edit-theme [class*="bg-slate-50/"] {
            background-color: rgba(7, 17, 26, 0.88) !important;
          }

          .property-edit-theme .border-slate-100,
          .property-edit-theme .border-slate-200,
          .property-edit-theme .border-slate-300 {
            border-color: rgba(255,255,255,0.08) !important;
          }

          .property-edit-theme .text-slate-950,
          .property-edit-theme .text-slate-900,
          .property-edit-theme .text-slate-800,
          .property-edit-theme .text-slate-700 {
            color: #FFF8EA !important;
          }

          .property-edit-theme .text-slate-600,
          .property-edit-theme .text-slate-500 {
            color: #8EA0AE !important;
          }

          .property-edit-theme .text-slate-400 {
            color: #6F7E8A !important;
          }

          .property-edit-theme input,
          .property-edit-theme textarea,
          .property-edit-theme select {
            background-color: #07111A !important;
            color: #FFF8EA !important;
            border-color: rgba(255,255,255,0.12) !important;
          }

          .property-edit-theme input:focus,
          .property-edit-theme textarea:focus,
          .property-edit-theme select:focus {
            border-color: rgba(216,179,103,0.72) !important;
            box-shadow: 0 0 0 3px rgba(216,179,103,0.08) !important;
          }

          .property-edit-theme .bg-blue-50,
          .property-edit-theme .bg-blue-100 {
            background-color: rgba(216,179,103,0.08) !important;
          }

          .property-edit-theme .border-blue-100,
          .property-edit-theme .border-blue-200,
          .property-edit-theme .border-blue-300 {
            border-color: rgba(216,179,103,0.20) !important;
          }

          .property-edit-theme .text-blue-600,
          .property-edit-theme .text-blue-700 {
            color: #D8B367 !important;
          }

          .property-edit-theme section,
          .property-edit-theme article {
            color: #FFF8EA;
          }

          .property-edit-theme hr {
            border-color: rgba(255,255,255,0.08) !important;
          }
        `}</style>
      </AppShell>
    </>
  );
}
