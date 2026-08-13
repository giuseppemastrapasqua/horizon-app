type HorizonLogoProps = {
  compact?: boolean;
  className?: string;
};

export function HorizonLogo({
  compact = false,
  className = "",
}: HorizonLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 shadow-sm shadow-blue-600/20">
        <div className="relative h-5 w-6">
          <span className="absolute left-0 top-0 h-full w-1.5 rounded-full bg-white" />
          <span className="absolute right-0 top-0 h-full w-1.5 rounded-full bg-white" />
          <span className="absolute left-1/2 top-1/2 h-1.5 w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
          <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-sky-200" />
        </div>
      </div>

      {!compact ? (
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-slate-950">
            Horizon
          </p>

          <p className="truncate text-xs text-slate-500">
            Property Management OS
          </p>
        </div>
      ) : null}
    </div>
  );
}