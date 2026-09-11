import {
  BadgePercent,
  CalendarRange,
  Check,
  Euro,
  Plus,
  Save,
  ShieldCheck,
  Tags,
  Trash2,
} from "lucide-react";

import {
  AppShell,
} from "@/components/AppShell";

import {
  Navigation,
} from "@/components/Navigation";

import type {
  Prisma,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import {
  getAccessiblePropertyIds,
} from "@/lib/auth/guards";

import {
  createCustomRateAction,
  deleteCustomRateAction,
  saveRateTypesAction,
  updateCustomRateAction,
} from "./actions";

import { requireUser } from "@/lib/auth/guards";
type RateTypesPageProps = {
  searchParams: Promise<{
    propertyId?:
      | string
      | string[];
  }>;
};

export default async function RateTypesPage({
  searchParams,
}: RateTypesPageProps) {
  const user = await requireUser();

  if (user.role === "OPERATOR") {
    throw new Error("Accesso non autorizzato.");
  }
  const params =
    await searchParams;

  const requestedPropertyId =
    typeof params.propertyId ===
    "string"
      ? params.propertyId.trim()
      : "";

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
        maxGuests: true,
      },
    });

  const selectedProperty =
    properties.find(
      (property) =>
        property.id ===
        requestedPropertyId,
    ) ??
    properties[0] ??
    null;

  const ratePlans =
    selectedProperty
      ? await prisma.propertyRatePlan.findMany({
          where: {
            propertyId:
              selectedProperty.id,
          },

          include: {
            occupancyPrices: {
              orderBy: {
                guests: "asc",
              },
            },

            rules: {
              where: {
                name: {
                  startsWith:
                    "HORIZON_RATE_DISCOUNT_",
                },
              },

              orderBy: {
                priority:
                  "desc",
              },
            },
          },

          orderBy: {
            createdAt:
              "asc",
          },
        })
      : [];

  const standard =
    getRatePlan(
      ratePlans,
      "STANDARD",
    );

  const nonRefundable =
    getRatePlan(
      ratePlans,
      "NON_REFUNDABLE",
    );

  const weekly =
    getRatePlan(
      ratePlans,
      "WEEKLY",
    );

  const monthly =
    getRatePlan(
      ratePlans,
      "MONTHLY",
    );

  const customRates =
    ratePlans.filter(
      (ratePlan) =>
        ratePlan.code.startsWith(
          "CUSTOM_",
        ),
    );

  return (
    <>
      <Navigation />

      <AppShell
        title="Tipologie tariffe"
        subtitle="Configura la struttura tariffaria di ogni alloggio."
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#D8B367]">
              Revenue configuration
            </p>

            <p className="mt-1 text-[10px] text-[#82909C]">
              Sconti, durata minima e durata massima
              vengono definiti per ogni singola tariffa.
            </p>
          </div>

          <form
            method="get"
            className="flex items-center gap-2"
          >
            <span className="text-[9px] font-semibold text-[#82909C]">
              Struttura
            </span>

            <select
              name="propertyId"
              defaultValue={
                selectedProperty?.id ??
                ""
              }
              className="h-10 min-w-[240px] rounded-xl border border-white/[0.08] bg-[#07111A] px-3 text-[10px] font-semibold text-[#E8E1D5] outline-none [color-scheme:dark] focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10"
            >
              {properties.map(
                (property) => (
                  <option
                    key={
                      property.id
                    }
                    value={
                      property.id
                    }
                  >
                    {
                      property.name
                    }
                  </option>
                ),
              )}
            </select>

            <button
              type="submit"
              className="h-10 rounded-xl border border-[#D8B367]/30 bg-[#D8B367]/[0.07] px-3 text-[9px] font-semibold text-[#D8B367] transition hover:bg-[#D8B367]/[0.12]"
            >
              Apri
            </button>
          </form>
        </div>

        {!selectedProperty ? (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <Tags
              size={22}
              className="mx-auto text-blue-500"
            />

            <h2 className="mt-3 font-serif text-sm font-semibold text-[#FFF8EA]">
              Nessuna struttura disponibile
            </h2>
          </section>
        ) : (
          <>
            <section className="mb-4 rounded-2xl border border-white/[0.07] bg-[#09131C]/90 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#D8B367]">
                    {
                      selectedProperty.name
                    }
                  </p>

                  <p className="mt-1 max-w-3xl text-[10px] leading-4 text-[#82909C]">
                    Ogni tariffa può avere uno sconto,
                    un minimo soggiorno e un massimo soggiorno
                    completamente personalizzati.
                  </p>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.1em] text-emerald-300">
                  <Check
                    size={11}
                  />

                  Configurazione per struttura
                </span>
              </div>
            </section>

            <form
              action={
                saveRateTypesAction
              }
            >
              <input
                type="hidden"
                name="propertyId"
                value={
                  selectedProperty.id
                }
              />

              <section className="grid gap-3 xl:grid-cols-2">
                <RateCard
                  icon={
                    <Euro
                      size={18}
                    />
                  }
                  title="Standard Rate"
                  description="Tariffa madre e prezzo di riferimento."
                  accent="blue"
                >
                  <div className="grid gap-3 sm:grid-cols-4">


                    <StayField
                      label="Min notti"
                      name="standardMinimumStay"
                      value={
                        standard?.minimumStay ??
                        1
                      }
                    />

                    <StayField
                      label="Max notti"
                      name="standardMaximumStay"
                      value={
                        standard?.maximumStay
                      }
                      optional
                    />

                    <GuestCountField
                      label="Vendibile da"
                      name="standardMinimumGuests"
                      value={
                        standard?.minimumGuests ?? 1
                      }
                      maxGuests={
                        selectedProperty.maxGuests
                      }
                    />

                    <GuestCountField
                      label="Ospiti inclusi"
                      name="standardOccupancyIncluded"
                      value={
                        standard?.occupancyIncluded ?? 1
                      }
                      maxGuests={
                        selectedProperty.maxGuests
                      }
                    />

                    <ExtraGuestPriceField
                      name="standardExtraGuestPrice"
                      value={
                        getExtraGuestPrice(standard)
                      }
                    />
                    <Field
                      label="Vendita"
                    >
                      <div className="flex h-11 items-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.07] px-3 text-[9px] font-semibold text-emerald-300">
                        Sempre attiva
                      </div>
                    </Field>
                  </div>
                </RateCard>

                <RateCard
                  icon={
                    <ShieldCheck
                      size={18}
                    />
                  }
                  title="Non Refundable"
                  description="Tariffa scontata non rimborsabile."
                  accent="emerald"
                >
                  <DerivedRateFields
                    prefix="nonRefundable"
                    defaultActive={
                      nonRefundable?.active ??
                      true
                    }
                    discount={
                      getDiscount(
                        nonRefundable,
                      )
                    }
                    minimumStay={
                      nonRefundable?.minimumStay ??
                      1
                    }
                    maximumStay={
                      nonRefundable?.maximumStay ?? null
                    }
                    minimumGuests={
                      nonRefundable?.minimumGuests ?? 1
                    }
                    occupancyIncluded={
                      nonRefundable?.occupancyIncluded ?? 1
                    }
                    extraGuestPrice={
                      getExtraGuestPrice(nonRefundable)
                    }
                    maxGuests={
                      selectedProperty.maxGuests
                    }
                  />
                </RateCard>

                <RateCard
                  icon={
                    <CalendarRange
                      size={18}
                    />
                  }
                  title="Weekly Rate"
                  description="Tariffa dedicata ai soggiorni medio-lunghi."
                  accent="sky"
                >
                  <DerivedRateFields
                    prefix="weekly"
                    defaultActive={
                      weekly?.active ??
                      true
                    }
                    discount={
                      getDiscount(
                        weekly,
                      )
                    }
                    minimumStay={
                      weekly?.minimumStay ??
                      7
                    }
                    maximumStay={
                      weekly?.maximumStay ?? null
                    }
                    minimumGuests={
                      weekly?.minimumGuests ?? 1
                    }
                    occupancyIncluded={
                      weekly?.occupancyIncluded ?? 1
                    }
                    extraGuestPrice={
                      getExtraGuestPrice(weekly)
                    }
                    maxGuests={
                      selectedProperty.maxGuests
                    }
                  />
                </RateCard>

                <RateCard
                  icon={
                    <BadgePercent
                      size={18}
                    />
                  }
                  title="Monthly Rate"
                  description="Tariffa dedicata ai soggiorni lunghi."
                  accent="indigo"
                >
                  <DerivedRateFields
                    prefix="monthly"
                    defaultActive={
                      monthly?.active ??
                      true
                    }
                    discount={
                      getDiscount(
                        monthly,
                      )
                    }
                    minimumStay={
                      monthly?.minimumStay ??
                      28
                    }
                    maximumStay={
                      monthly?.maximumStay ?? null
                    }
                    minimumGuests={
                      monthly?.minimumGuests ?? 1
                    }
                    occupancyIncluded={
                      monthly?.occupancyIncluded ?? 1
                    }
                    extraGuestPrice={
                      getExtraGuestPrice(monthly)
                    }
                    maxGuests={
                      selectedProperty.maxGuests
                    }
                  />
                </RateCard>
              </section>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D8B367] px-5 py-3 text-[10px] font-semibold text-[#07111A] shadow-[0_8px_20px_rgba(216,179,103,0.12)] transition hover:bg-[#E3C37E]"
                >
                  <Save
                    size={14}
                  />

                  Salva tariffe principali
                </button>
              </div>
            </form>

            <section className="mt-8">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#D8B367]">
                    Tariffe personalizzate
                  </p>

                  <h2 className="mt-1 font-serif text-lg font-semibold tracking-tight text-[#FFF8EA]">
                    Piani tariffari aggiuntivi
                  </h2>

                  <p className="mt-1 text-[9px] text-[#82909C]">
                    Ogni piano deriva dalla Standard Rate
                    della struttura.
                  </p>
                </div>
              </div>

              {customRates.length >
              0 ? (
                <div className="mb-4 grid gap-3 xl:grid-cols-2">
                  {customRates.map(
                    (ratePlan) => (
                      <form
                        key={
                          ratePlan.id
                        }
                        action={
                          updateCustomRateAction
                        }
                        className="rounded-2xl border border-white/[0.07] bg-[#09131C]/90 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)]"
                      >
                        <input
                          type="hidden"
                          name="propertyId"
                          value={
                            selectedProperty.id
                          }
                        />

                        <input
                          type="hidden"
                          name="ratePlanId"
                          value={
                            ratePlan.id
                          }
                        />

                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8B367]/20 bg-[#D8B367]/[0.07] text-[#D8B367]">
                              <Tags
                                size={17}
                              />
                            </span>

                            <div>
                              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#D8B367]">
                                Personalizzata
                              </p>

                              <p className="mt-1 text-[8px] font-medium text-[#6F7E8A]">
                                {
                                  ratePlan.code
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-6">
                          <Field
                            label="Nome"
                          >
                            <input
                              type="text"
                              name="name"
                              defaultValue={
                                ratePlan.name
                              }
                              required
                              className={inputClass}
                            />
                          </Field>

                          <AdjustmentModeField
                            name="adjustmentMode"
                            value={
                              getAdjustmentMode(
                                ratePlan,
                              )
                            }
                          />

                          <AdjustmentValueField
                            name="adjustmentValue"
                            value={
                              getAdjustmentMagnitude(
                                ratePlan,
                              )
                            }
                          />

                          <StayField
                            label="Min notti"
                            name="minimumStay"
                            value={
                              ratePlan.minimumStay
                            }
                          />

                          <StayField
                            label="Max notti"
                            name="maximumStay"
                            value={
                              ratePlan.maximumStay
                            }
                            optional
                          />

                          <GuestCountField
                            label="Vendibile da"
                            name="minimumGuests"
                            value={
                              ratePlan.minimumGuests
                            }
                            maxGuests={
                              selectedProperty.maxGuests
                            }
                          />

                          <GuestCountField
                            label="Ospiti inclusi"
                            name="occupancyIncluded"
                            value={
                              ratePlan.occupancyIncluded
                            }
                            maxGuests={
                              selectedProperty.maxGuests
                            }
                          />

                          <ExtraGuestPriceField
                            name="extraGuestPrice"
                            value={
                              getExtraGuestPrice(ratePlan)
                            }
                          />
                          <ActiveField
                            name="active"
                            checked={
                              ratePlan.active
                            }
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-end border-t border-white/[0.06] pt-3">
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="rounded-lg border border-[#D8B367]/30 bg-[#D8B367]/[0.07] px-3 py-2 text-[8px] font-semibold text-[#D8B367] transition hover:bg-[#D8B367]/[0.12]"
                            >
                              Salva
                            </button>

                            <button
                              formAction={
                                deleteCustomRateAction
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/20 bg-rose-400/[0.07] px-3 py-2 text-[8px] font-semibold text-rose-300 transition hover:bg-rose-400/[0.12]"
                            >
                              <Trash2
                                size={11}
                              />

                              Elimina
                            </button>
                          </div>
                        </div>
                      </form>
                    ),
                  )}
                </div>
              ) : (
                <div className="mb-4 rounded-2xl border border-dashed border-white/[0.10] bg-[#09131C]/90 px-5 py-7 text-center">
                  <p className="text-[10px] font-semibold text-[#A4AFB8]">
                    Nessuna tariffa personalizzata.
                  </p>
                </div>
              )}

              <details className="rounded-2xl border border-[#D8B367]/20 bg-[#09131C]/90 p-4">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-[10px] font-bold text-[#D8B367]">
                  <Plus
                    size={14}
                  />

                  Aggiungi tariffa personalizzata
                </summary>

                <form
                  action={
                    createCustomRateAction
                  }
                  className="mt-4"
                >
                  <input
                    type="hidden"
                    name="propertyId"
                    value={
                      selectedProperty.id
                    }
                  />

                  <div className="grid gap-3 sm:grid-cols-6">
                    <Field
                      label="Nome tariffa"
                    >
                      <input
                        type="text"
                        name="customName"
                        placeholder="Es. Early Booking"
                        required
                        className={inputClass}
                      />
                    </Field>

                    <AdjustmentModeField
                      name="customAdjustmentMode"
                      value="DISCOUNT"
                    />

                    <AdjustmentValueField
                      name="customAdjustmentValue"
                      value={0}
                    />

                    <StayField
                      label="Min notti"
                      name="customMinimumStay"
                      value={1}
                    />

                    <StayField
                      label="Max notti"
                      name="customMaximumStay"
                      value={null}
                      optional
                    />

                    <GuestCountField
                      label="Vendibile da"
                      name="customMinimumGuests"
                      value={1}
                      maxGuests={
                        selectedProperty.maxGuests
                      }
                    />

                    <GuestCountField
                      label="Ospiti inclusi"
                      name="customOccupancyIncluded"
                      value={1}
                      maxGuests={
                        selectedProperty.maxGuests
                      }
                    />

                    <ExtraGuestPriceField
                      name="customExtraGuestPrice"
                      value={0}
                    />
                    <ActiveField
                      name="customActive"
                      checked
                    />
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#D8B367] px-4 py-2.5 text-[9px] font-semibold text-[#07111A] transition hover:bg-[#E3C37E]"
                    >
                      <Plus
                        size={13}
                      />

                      Crea tariffa
                    </button>
                  </div>
                </form>
              </details>
            </section>
          </>
        )}
      </AppShell>
    </>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/[0.08] bg-[#07111A] px-3 text-[11px] font-semibold text-[#E8E1D5] outline-none [color-scheme:dark] transition placeholder:text-[#526472] focus:border-[#D8B367]/60 focus:ring-2 focus:ring-[#D8B367]/10";

function RateCard({
  icon,
  title,
  description,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent:
    | "blue"
    | "emerald"
    | "sky"
    | "indigo";
  children: React.ReactNode;
}) {
  const accentClasses = {
    blue:
      "border-[#D8B367]/20 bg-[#D8B367]/[0.07] text-[#D8B367]",

    emerald:
      "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300",

    sky:
      "border-sky-400/20 bg-sky-400/[0.07] text-sky-300",

    indigo:
      "border-indigo-400/20 bg-indigo-400/[0.07] text-indigo-300",
  };

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-[#09131C]/90 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.16)]">
      <div className="mb-4 flex items-start gap-3">
        <span
          className={[
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            accentClasses[
              accent
            ],
          ].join(
            " ",
          )}
        >
          {icon}
        </span>

        <div>
          <h2 className="font-serif text-sm font-semibold text-[#FFF8EA]">
            {title}
          </h2>

          <p className="mt-1 text-[9px] leading-4 text-[#82909C]">
            {description}
          </p>
        </div>
      </div>

      {children}
    </article>
  );
}

function getExtraGuestPrice(
  ratePlan:
    | {
        occupancyIncluded: number;
        occupancyPrices: Array<{
          guests: number;
          adjustmentType: string;
          adjustmentValue: Prisma.Decimal;
        }>;
      }
    | null
    | undefined,
): number {
  if (!ratePlan) {
    return 0;
  }

  const firstExtra =
    ratePlan.occupancyPrices.find(
      (price) =>
        price.guests ===
          ratePlan.occupancyIncluded + 1 &&
        price.adjustmentType === "FIXED",
    );

  return firstExtra
    ? Number(firstExtra.adjustmentValue)
    : 0;
}
function DerivedRateFields({
  prefix,
  defaultActive,
  discount,
  minimumStay,
  maximumStay,

  minimumGuests,
  occupancyIncluded,
  extraGuestPrice,
  maxGuests,
}: {
  prefix:
    | "nonRefundable"
    | "weekly"
    | "monthly";
  defaultActive: boolean;
  discount: number;
  minimumStay: number;
  maximumStay: number | null;

  minimumGuests: number;
  occupancyIncluded: number;
  extraGuestPrice: number;
  maxGuests: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <DiscountField
        name={`${prefix}Discount`}
        value={discount}
      />


      <StayField
        label="Min notti"
        name={`${prefix}MinimumStay`}
        value={minimumStay}
      />

      <StayField
        label="Max notti"
        name={`${prefix}MaximumStay`}
        value={maximumStay}
        optional
      />

      <GuestCountField
        label="Vendibile da"
        name={`${prefix}MinimumGuests`}
        value={minimumGuests}
        maxGuests={maxGuests}
      />

      <GuestCountField
        label="Ospiti inclusi"
        name={`${prefix}OccupancyIncluded`}
        value={occupancyIncluded}
        maxGuests={maxGuests}
      />

      <ExtraGuestPriceField
        name={`${prefix}ExtraGuestPrice`}
        value={extraGuestPrice}
      />

      <ActiveField
        name={`${prefix}Active`}
        checked={defaultActive}
      />
    </div>
  );
}
function GuestCountField({
  label,
  name,
  value,
  maxGuests,
}: {
  label: string;
  name: string;
  value: number;
  maxGuests: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        name={name}
        min="1"
        max={maxGuests}
        step="1"
        defaultValue={value}
        className={inputClass}
      />
    </Field>
  );
}

function ExtraGuestPriceField({
  name,
  value,
}: {
  name: string;
  value: number;
}) {
  return (
    <Field label="Extra ospite">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#82909C]">
          €
        </span>

        <input
          type="number"
          name={name}
          min="0"
          step="0.01"
          defaultValue={value}
          className={[
            inputClass,
            "pl-7",
          ].join(" ")}
        />
      </div>
    </Field>
  );
}
function DiscountField({
  name,
  value,
}: {
  name: string;
  value: number;
}) {
  return (
    <Field
      label="Sconto"
    >
      <div className="relative">
        <input
          type="number"
          name={name}
          min="0"
          max="90"
          step="0.1"
          defaultValue={
            value
          }
          className={inputClass}
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#82909C]">
          %
        </span>
      </div>
    </Field>
  );
}

function AdjustmentModeField({
  name,
  value,
}: {
  name: string;
  value:
    | "DISCOUNT"
    | "MARKUP";
}) {
  return (
    <Field
      label="Variazione"
    >
      <select
        name={name}
        defaultValue={value}
        className={inputClass}
      >
        <option value="DISCOUNT">
          Sconto
        </option>

        <option value="MARKUP">
          Maggiorazione
        </option>
      </select>
    </Field>
  );
}

function AdjustmentValueField({
  name,
  value,
}: {
  name: string;
  value: number;
}) {
  return (
    <Field
      label="Percentuale"
    >
      <div className="relative">
        <input
          type="number"
          name={name}
          min="0"
          max="300"
          step="0.1"
          defaultValue={value}
          className={inputClass}
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#82909C]">
          %
        </span>
      </div>
    </Field>
  );
}

function StayField({
  label,
  name,
  value,
  optional = false,
}: {
  label: string;
  name: string;
  value:
    | number
    | null
    | undefined;
  optional?: boolean;
}) {
  return (
    <Field
      label={label}
    >
      <input
        type="number"
        name={name}
        min="1"
        step="1"
        defaultValue={
          value ??
          ""
        }
        placeholder={
          optional
            ? "Nessun limite"
            : undefined
        }
        required={
          !optional
        }
        className={inputClass}
      />
    </Field>
  );
}

function ActiveField({
  name,
  checked,
}: {
  name: string;
  checked: boolean;
}) {
  return (
    <Field
      label="Vendita"
    >
      <label className="flex h-11 cursor-pointer items-center justify-between rounded-xl border border-white/[0.08] bg-[#07111A] px-3">
        <span className="text-[9px] font-semibold text-[#E8E1D5]">
          Attiva
        </span>

        <input
          type="checkbox"
          name={name}
          defaultChecked={
            checked
          }
          className="h-4 w-4 accent-[#D8B367]"
        />
      </label>
    </Field>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.1em] text-[#82909C]">
        {label}
      </span>

      {children}
    </label>
  );
}

type RatePlanWithRules =
  Prisma.PropertyRatePlanGetPayload<{
    include: {
      rules: true;
      occupancyPrices: true;
    };
  }>;

function getRatePlan(
  ratePlans:
    RatePlanWithRules[],
  code: string,
) {
  return ratePlans.find(
    (ratePlan) =>
      ratePlan.code ===
      code,
  );
}

function getDiscount(
  ratePlan:
    | {
        rules: Array<{
          adjustmentValue:
            unknown;
        }>;
      }
    | null
    | undefined,
) {
  const rule =
    ratePlan?.rules?.[0];

  return rule
    ? Math.abs(
        Number(
          rule.adjustmentValue,
        ),
      )
    : 0;
}

function getSignedAdjustment(
  ratePlan:
    | {
        rules: Array<{
          adjustmentValue:
            unknown;
        }>;
      }
    | null
    | undefined,
) {
  const rule =
    ratePlan?.rules?.[0];

  return rule
    ? Number(
        rule.adjustmentValue,
      )
    : 0;
}

function getAdjustmentMode(
  ratePlan:
    | {
        rules: Array<{
          adjustmentValue:
            unknown;
        }>;
      }
    | null
    | undefined,
):
  | "DISCOUNT"
  | "MARKUP" {
  return getSignedAdjustment(
    ratePlan,
  ) > 0
    ? "MARKUP"
    : "DISCOUNT";
}

function getAdjustmentMagnitude(
  ratePlan:
    | {
        rules: Array<{
          adjustmentValue:
            unknown;
        }>;
      }
    | null
    | undefined,
) {
  return Math.abs(
    getSignedAdjustment(
      ratePlan,
    ),
  );
}


