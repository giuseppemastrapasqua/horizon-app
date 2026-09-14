"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Home,
  Menu,
  ReceiptText,
  Settings,
  Sparkles,
  Tags,
  Users,
  X,
} from "lucide-react";

import { UserMenu } from "@/components/auth/UserMenu";
import { HorizonLogo } from "@/components/ui/HorizonLogo";

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Home,
    operatorVisible: false,
  },
  {
    href: "/bookings",
    label: "Prenotazioni",
    icon: CalendarDays,
    operatorVisible: true,
  },
  {
    href: "/calendar",
    label: "Calendario",
    icon: CalendarDays,
    operatorVisible: true,
  },
  {
    href: "/revenue-ai",
    label: "Revenue AI",
    icon: Sparkles,
    operatorVisible: false,
  },
  {
    href: "/tasks",
    label: "Task",
    icon: ClipboardCheck,
    operatorVisible: true,
  },
  {
    href: "/documents",
    label: "Documenti",
    icon: FileText,
    operatorVisible: false,
  },
  {
    href: "/invoices",
    label: "Fatture",
    icon: ReceiptText,
    operatorVisible: false,
  },
  {
    href: "/rate-types",
    label: "Tipologie tariffe",
    icon: Tags,
    operatorVisible: false,
  },
  {
    href: "/reports/finance",
    label: "Rendiconto",
    icon: BarChart3,
    operatorVisible: false,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const homeHref =
    session?.user?.role === "OPERATOR"
      ? "/bookings"
      : "/dashboard";

  const visibleNavigationItems = [
    ...navigationItems.filter(
      (item) =>
        session?.user?.role !== "OPERATOR" ||
        item.operatorVisible,
    ),
    ...(session?.user?.role === "SUPER_ADMIN"
      ? [
          {
            href: "/collaborators",
            label: "Collaboratori",
            icon: Users,
            operatorVisible: false,
          },
        ]
      : []),
  ];

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === href
      : pathname === href ||
        pathname.startsWith(`${href}/`);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[220px] flex-col overflow-hidden border-r border-white/[0.06] bg-[#07111A] text-[#FFF8EA] shadow-[18px_0_45px_rgba(0,0,0,0.28)] lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(216,179,103,0.10),transparent_32%)]" />

        <div className="relative flex h-[104px] shrink-0 items-center border-b border-white/[0.07] px-5">
          <Link
            href={homeHref}
            aria-label="Horizon Dashboard"
            className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B367]/50"
          >
            <HorizonLogo className="brightness-0 invert opacity-95" />
          </Link>
        </div>

        <nav className="relative min-h-0 flex-1 px-3 py-5">
          <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[#D8B367]/60">
            Workspace
          </p>

          <div className="space-y-1.5">
            {visibleNavigationItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group relative flex h-[43px] items-center gap-3 overflow-hidden rounded-xl px-3.5 text-[12px] font-semibold transition-all duration-200",
                    active
                      ? "border border-[#D8B367]/20 bg-[#D8B367]/[0.10] text-[#FFF8EA] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                      : "border border-transparent text-[#AAB6C2] hover:border-white/[0.05] hover:bg-white/[0.04] hover:text-white",
                  ].join(" ")}
                >
                  {active ? (
                    <span className="absolute inset-y-2 left-0 w-[2px] rounded-r-full bg-[#D8B367]" />
                  ) : null}

                  <Icon
                    size={17}
                    strokeWidth={active ? 2.1 : 1.7}
                    className={[
                      "shrink-0 transition-colors",
                      active
                        ? "text-[#E3C57E]"
                        : "text-[#667685] group-hover:text-[#D8B367]",
                    ].join(" ")}
                  />

                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="relative shrink-0 border-t border-white/[0.07] px-3 pb-4 pt-3">
          {session?.user?.role !== "OPERATOR" ? (
            <Link
              href="/settings"
              className="mb-2 flex h-[40px] items-center gap-3 rounded-xl border border-transparent px-3.5 text-[12px] font-medium text-[#8493A1] transition hover:border-white/[0.05] hover:bg-white/[0.04] hover:text-white"
            >
              <Settings
                size={16}
                strokeWidth={1.7}
                className="shrink-0 text-[#667685]"
              />

              <span>Impostazioni</span>
            </Link>
          ) : null}

          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-1">
            <UserMenu
              name={session?.user?.name}
              email={session?.user?.email}
              role={session?.user?.role}
            />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/[0.07] bg-[#07111A]/95 px-4 text-white backdrop-blur-xl lg:hidden">
        <Link
          href={homeHref}
          aria-label="Horizon Dashboard"
          className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8B367]/50"
        >
          <HorizonLogo className="brightness-0 invert opacity-95" />
        </Link>

        <button
          type="button"
          aria-label={mobileOpen ? "Chiudi menu" : "Apri menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMobileOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-[#FFF8EA] transition hover:bg-white/[0.08]"
        >
          {mobileOpen ? (
            <X size={20} strokeWidth={1.8} />
          ) : (
            <Menu size={20} strokeWidth={1.8} />
          )}
        </button>
      </header>

      {mobileOpen ? (
        <div className="fixed inset-0 top-16 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Chiudi menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
          />

          <aside
            id="mobile-navigation"
            className="absolute inset-y-0 right-0 flex w-[min(320px,88vw)] flex-col border-l border-white/[0.07] bg-[#07111A] text-[#FFF8EA] shadow-[-20px_0_50px_rgba(0,0,0,0.40)]"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(216,179,103,0.10),transparent_34%)]" />

            <nav className="relative min-h-0 flex-1 overflow-y-auto px-3 py-5">
              <p className="mb-3 px-3 text-[9px] font-bold uppercase tracking-[0.22em] text-[#D8B367]/60">
                Workspace
              </p>

              <div className="space-y-1.5">
                {visibleNavigationItems.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMobileOpen(false)}
                      className={[
                        "group relative flex h-[46px] items-center gap-3 overflow-hidden rounded-xl px-3.5 text-[13px] font-semibold transition-all duration-200",
                        active
                          ? "border border-[#D8B367]/20 bg-[#D8B367]/[0.10] text-[#FFF8EA]"
                          : "border border-transparent text-[#AAB6C2] hover:bg-white/[0.04] hover:text-white",
                      ].join(" ")}
                    >
                      {active ? (
                        <span className="absolute inset-y-2 left-0 w-[2px] rounded-r-full bg-[#D8B367]" />
                      ) : null}

                      <Icon
                        size={18}
                        strokeWidth={active ? 2.1 : 1.7}
                        className={
                          active
                            ? "shrink-0 text-[#E3C57E]"
                            : "shrink-0 text-[#667685]"
                        }
                      />

                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="relative shrink-0 border-t border-white/[0.07] px-3 pb-4 pt-3">
              {session?.user?.role !== "OPERATOR" ? (
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="mb-2 flex h-[44px] items-center gap-3 rounded-xl px-3.5 text-[13px] font-medium text-[#8493A1] transition hover:bg-white/[0.04] hover:text-white"
                >
                  <Settings
                    size={17}
                    strokeWidth={1.7}
                    className="shrink-0 text-[#667685]"
                  />
                  <span>Impostazioni</span>
                </Link>
              ) : null}

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-1">
                <UserMenu
                  name={session?.user?.name}
                  email={session?.user?.email}
                  role={session?.user?.role}
                />
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
