import type {
  ReactNode,
} from "react";

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
    <main className="min-h-screen min-w-0 bg-[#F8FAFC] px-4 py-5 sm:px-6 lg:ml-[220px] lg:px-7 lg:py-6 xl:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        {title || subtitle ? (
          <header className="mb-6">
            {title ? (
              <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em] text-[#0F172A] md:text-[32px]">
                {title}
              </h1>
            ) : null}

            {subtitle ? (
              <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[#64748B]">
                {subtitle}
              </p>
            ) : null}
          </header>
        ) : null}

        <div className="min-w-0">
          {children}
        </div>
      </div>
    </main>
  );
}


