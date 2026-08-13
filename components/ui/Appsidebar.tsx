import {
  BarChart3,
  Building2,
 Bot,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";

import { HorizonLogo } from "./HorizonLogo";

const navigation = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    active: true,
  },
  {
    icon: Building2,
    label: "Immobili",
  },
  {
    icon: CalendarDays,
    label: "Prenotazioni",
  },
  {
    icon: CreditCard,
    label: "Finanza",
  },
  {
    icon: Users,
    label: "Proprietari",
  },
  {
    icon: BarChart3,
    label: "Analytics",
  },
  {
    icon: Bot,
    label: "AI Copilot",
  },
];

export function AppSidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-6">
        <HorizonLogo />
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${
                item.active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="size-5" />

              <span className="font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-100">
          <Settings className="size-5" />

          <span className="font-medium">
            Impostazioni
          </span>
        </button>
      </div>
    </aside>
  );
}