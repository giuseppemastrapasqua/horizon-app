import {
  BarChart3,
  Building2,
  CalendarDays,
} from "lucide-react";

import {
  getAccessiblePropertyIds,
} from "@/lib/auth/guards";

import {
  prisma,
} from "@/lib/prisma";

import {
  runRevenueAiWorkspaceAnalysisAction,
} from "./actions";

type RevenueAiWorkspaceControlsProps = {
  propertyId: string;
  from: string;
  to: string;
};

export async function RevenueAiWorkspaceControls({
  propertyId,
  from,
  to,
}: RevenueAiWorkspaceControlsProps) {
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

  return (
    <form
      action={
        runRevenueAiWorkspaceAnalysisAction
      }
      className="mb-6 rounded-3xl border border-white/[0.08] bg-white/[0.035] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
    >
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[240px] flex-1">
          <span className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#8795A1]">
            <Building2 size={12} />
            Struttura
          </span>

          <select
            name="propertyId"
            defaultValue={
              propertyId
            }
            className="h-11 w-full rounded-xl border border-white/[0.09] bg-[#0B1720] px-3 text-[12px] font-semibold text-[#FFF8EA] outline-none transition focus:border-[#D8B367]/50"
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
        </label>

        <label className="min-w-[170px]">
          <span className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#8795A1]">
            <CalendarDays
              size={12}
            />
            Dal
          </span>

          <input
            type="date"
            name="from"
            defaultValue={from}
            required
            className="h-11 w-full rounded-xl border border-white/[0.09] bg-[#0B1720] px-3 text-[12px] font-semibold text-[#FFF8EA] outline-none transition focus:border-[#D8B367]/50"
          />
        </label>

        <label className="min-w-[170px]">
          <span className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#8795A1]">
            <CalendarDays
              size={12}
            />
            Al
          </span>

          <input
            type="date"
            name="to"
            defaultValue={to}
            required
            className="h-11 w-full rounded-xl border border-white/[0.09] bg-[#0B1720] px-3 text-[12px] font-semibold text-[#FFF8EA] outline-none transition focus:border-[#D8B367]/50"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-[12px] font-bold text-white shadow-[0_10px_26px_rgba(79,70,229,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(79,70,229,0.28)]"
        >
          <BarChart3
            size={14}
          />
          Analizza
        </button>
      </div>
    </form>
  );
}
