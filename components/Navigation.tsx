"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  FileText,
  Gauge,
  Home,
  Sparkles,
  Users,
  UserRound,
} from "lucide-react";

import { UserMenu } from "@/components/auth/UserMenu";
import { HorizonLogo } from "@/components/ui/HorizonLogo";

const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: Gauge,
  },
  {
    href: "/properties",
    label: "Immobili",
    icon: Building2,
  },
  {
    href: "/owners",
    label: "Proprietari",
    icon: Users,
  },
  {
    href: "/bookings",
    label: "Prenotazioni",
    icon: CalendarDays,
  },
  {
    href: "/guests",
    label: "Ospiti",
    icon: UserRound,
  },
  {
    href: "/bookings/new",
    label: "Nuova prenotazione",
    icon: CalendarPlus,
  },
  {
    href: "/calendar",
    label: "Calendario",
    icon: Home,
  },
  {
    href: "/tasks",
    label: "Task operativi",
    icon: ClipboardCheck,
  },
  {
    href: "/reports/finance",
    label: "Report",
    icon: BarChart3,
  },
  {
    href: "/documents",
    label: "Documenti",
    icon: FileText,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-y-auto border-r border-white/10 bg-slate-950 px-5 py-6 text-white shadow-2xl shadow-slate-950/20">
      <div className="shrink-0 px-1">
        <Link
          href="/dashboard"
          className="inline-flex rounded-2xl transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
        >
          <HorizonLogo className="[&_p:first-of-type]:text-white [&_p:last-of-type]:text-slate-400" />
        </Link>
      </div>

      <div className="mt-8 flex items-center gap-2 rounded-2xl border border-blue-400/15 bg-blue-400/10 px-3 py-2.5 text-xs font-medium text-blue-200">
        <Sparkles className="size-4 shrink-0" />
        <span>Property Intelligence</span>
      </div>

      <nav className="mt-6 grid gap-1">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

          return (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive}
            />
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <UserMenu
          name={session?.user?.name}
          email={session?.user?.email}
          role={session?.user?.role}
        />
      </div>
    </aside>
  );
}

type NavLinkProps = {
  href: string;
  label: string;
  icon: typeof Gauge;
  active: boolean;
};

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: NavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={[
        "group flex min-h-11 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20",
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "text-slate-300 hover:bg-white/[0.07] hover:text-white",
      ].join(" ")}
    >
      <Icon
        className={[
          "size-5 shrink-0 transition",
          active
            ? "text-white"
            : "text-slate-500 group-hover:text-slate-200",
        ].join(" ")}
      />

      <span>{label}</span>
    </Link>
  );
}