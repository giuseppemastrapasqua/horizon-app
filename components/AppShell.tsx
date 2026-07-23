import type { ReactNode } from "react";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function AppShell({
  title,
  subtitle,
  children,
}: AppShellProps) {
  return (
    <main className="ml-[280px] min-h-screen min-w-0 bg-slate-50 px-8 py-10 xl:px-12 xl:py-12">
      <div className="mx-auto w-full max-w-[1440px]">
        <header className="mb-8">
          <h1 className="m-0 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            {title}
          </h1>

          {subtitle ? (
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              {subtitle}
            </p>
          ) : null}
        </header>

        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}