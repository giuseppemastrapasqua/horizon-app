"use client";

import Link from "next/link";

type ActionButtonProps = {
  label: string;
  href?: string;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger" | "ghost";
  compact?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

const variantClasses = {
  primary:
    "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:border-blue-700 hover:bg-blue-700",

  secondary:
    "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50",

  danger:
    "border-red-200 bg-red-50 text-red-700 hover:border-red-300 hover:bg-red-100",

  ghost:
    "border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-blue-700",
} satisfies Record<
  NonNullable<ActionButtonProps["variant"]>,
  string
>;

export function ActionButton({
  label,
  href,
  type = "button",
  variant = "primary",
  compact = false,
  disabled = false,
  onClick,
}: ActionButtonProps) {
  const className = [
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl border font-semibold transition",
    "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15",
    compact
      ? "min-h-9 px-3 py-2 text-xs"
      : "min-h-11 px-4 py-2.5 text-sm",
    variantClasses[variant],
    disabled
      ? "cursor-not-allowed opacity-50"
      : "cursor-pointer active:translate-y-px",
  ].join(" ");

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {label}
    </button>
  );
}
