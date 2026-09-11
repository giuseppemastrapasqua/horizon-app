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
    <main className="relative min-h-screen min-w-0 overflow-hidden bg-[#050B11] px-4 py-5 text-[#FFF8EA] sm:px-6 lg:ml-[220px] lg:px-7 lg:py-7 xl:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top_right,rgba(216,179,103,0.08),transparent_46%)]" />
      <div className="pointer-events-none absolute left-0 top-[220px] h-[500px] w-[500px] rounded-full bg-[#0C2030]/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1600px]">
        {title || subtitle ? (
          <header className="mb-7 border-b border-white/[0.07] pb-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-8 bg-[#D8B367]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-[#D8B367]">
                Horizon Hospitality
              </span>
            </div>

            {title ? (
              <h1 className="m-0 font-serif text-[30px] font-medium tracking-[-0.035em] text-[#FFF8EA] md:text-[36px]">
                {title}
              </h1>
            ) : null}

            {subtitle ? (
              <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#82909C]">
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
