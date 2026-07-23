import Link from "next/link";

const navigationItems = [
  {
    href: "/",
    label: "Dashboard",
  },
  {
    href: "/properties",
    label: "Immobili",
  },
  {
    href: "/owners",
    label: "Proprietari",
  },
  {
    href: "/bookings",
    label: "Prenotazioni",
  },
  {
    href: "/guests",
    label: "Ospiti",
  },
  {
    href: "/bookings/new",
    label: "+ Prenotazione",
  },
  {
    href: "/calendar",
    label: "Calendario",
  },
  {
    href: "/tasks",
    label: "Task operativi",
  },
  {
    href: "/reports/finance",
    label: "Report",
  },
  {
    href: "/documents",
    label: "Documenti",
  },
];

export function Navigation() {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-y-auto border-r border-white/10 bg-slate-950 px-6 py-7 text-white shadow-xl">
      <div className="shrink-0">
        <Link
          href="/"
          className="inline-flex items-center text-2xl font-extrabold tracking-tight text-white"
        >
          Horizon
        </Link>

        <p className="mt-1.5 text-sm text-slate-400">
          Property Intelligence
        </p>
      </div>

      <nav className="mt-9 grid gap-1.5">
        {navigationItems.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
          />
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 pt-5 text-sm text-slate-400">
        Beta Milano
      </div>
    </aside>
  );
}

type NavLinkProps = {
  href: string;
  label: string;
};

function NavLink({ href, label }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
    >
      {label}
    </Link>
  );
}