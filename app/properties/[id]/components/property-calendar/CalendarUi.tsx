export function Field({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium text-slate-500">
        {label}
      </span>

      {children}
    </label>
  );
}

export function CompactMetric({
  icon,
  label,
  value,
  emphasized = false,
}: {
  icon:
    React.ReactNode;
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={[
        "border-b border-r border-slate-200 px-3 py-2 last:border-r-0 lg:border-b-0",
        emphasized
          ? "bg-slate-950 text-white"
          : "bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider",
          emphasized
            ? "text-slate-300"
            : "text-slate-400",
        ].join(" ")}
      >
        {icon}
        {label}
      </div>

      <div
        className={[
          "mt-0.5 text-base font-semibold tracking-tight",
          emphasized
            ? "text-white"
            : "text-slate-950",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

export function Legend({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
      <span
        className={`h-2 w-2 rounded-full ${className}`}
      />

      {label}
    </div>
  );
}

