"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Home,
  ReceiptText,
  Settings,
  Tags,
} from "lucide-react";

import { UserMenu } from "@/components/auth/UserMenu";
import { HorizonLogo } from "@/components/ui/HorizonLogo";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/bookings", label: "Prenotazioni", icon: CalendarDays },
  { href: "/calendar", label: "Calendario", icon: CalendarDays },
  { href: "/tasks", label: "Task", icon: ClipboardCheck },
  { href: "/documents", label: "Documenti", icon: FileText },
  { href: "/invoices", label: "Fatture", icon: ReceiptText },
  { href: "/rate-types", label: "Tipologie tariffe", icon: Tags },
  { href: "/reports/finance", label: "Rendiconto", icon: BarChart3 },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[220px] flex-col bg-[#0B3C98] text-white shadow-[8px_0_30px_rgba(15,23,42,0.10)] lg:flex">

        <div className="flex h-[94px] shrink-0 items-center border-b border-white/[0.08] px-5">
          <Link
            href="/dashboard"
            aria-label="Horizon Dashboard"
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
          >
            <div className="origin-left scale-[0.90] brightness-0 invert">
              <HorizonLogo />
            </div>
          </Link>
        </div>

        <nav className="min-h-0 flex-1 px-3 py-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group relative flex h-[42px] items-center gap-3 rounded-xl px-3.5 text-[13px] font-semibold transition-all duration-200",
                    active
                      ? "bg-white/[0.15] text-white shadow-[0_5px_15px_rgba(0,0,0,0.10)] ring-1 ring-inset ring-white/[0.08]"
                      : "text-blue-50/80 hover:bg-white/[0.07] hover:text-white",
                  ].join(" ")}
                >
                  {active ? (
                    <span className="absolute -left-3 h-6 w-[3px] rounded-r-full bg-[#7EB2FF]" />
                  ) : null}

                  <Icon
                    size={17}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={
                      active
                        ? "shrink-0 text-white"
                        : "shrink-0 text-blue-100/75 group-hover:text-white"
                    }
                  />

                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-white/[0.08] px-3 pb-4 pt-3">
          <Link
            href="/settings"
            className="mb-2 flex h-[38px] items-center gap-3 rounded-xl px-3.5 text-[12px] font-medium text-blue-50/75 transition hover:bg-white/[0.07] hover:text-white"
          >
            <Settings
              size={16}
              strokeWidth={1.8}
              className="shrink-0"
            />

            <span>Impostazioni</span>
          </Link>

          <UserMenu
            name={session?.user?.name}
            email={session?.user?.email}
            role={session?.user?.role}
          />
        </div>
      </aside>

      <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-[#0B3C98] px-4 text-white lg:hidden">
        <div className="origin-left scale-[0.9] brightness-0 invert">
          <HorizonLogo />
        </div>

        <div className="w-[190px]">
          <UserMenu
            name={session?.user?.name}
            email={session?.user?.email}
            role={session?.user?.role}
          />
        </div>
      </header>
    </>
  );
}

