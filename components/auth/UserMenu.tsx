"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  ChevronUp,
  LoaderCircle,
  LogOut,
  UserRound,
} from "lucide-react";

type UserMenuProps = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export function UserMenu({
  name,
  email,
  role,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = name?.trim() || "Utente Horizon";
  const displayRole = formatRole(role);

  async function handleSignOut() {
    setIsSigningOut(true);

    await signOut({
      callbackUrl: "/login",
    });
  }

  return (
    <div className="relative">
      {isOpen ? (
        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-medium text-white">
              {displayName}
            </p>

            {email ? (
              <p className="mt-1 truncate text-xs text-slate-400">
                {email}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={isSigningOut}
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:text-slate-500"
          >
            {isSigningOut ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}

            {isSigningOut ? "Uscita in corso" : "Esci da Horizon"}
          </button>
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Apri menu utente"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left transition hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
          <UserRound className="size-5" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-slate-200">
            {displayName}
          </span>

          <span className="mt-0.5 block truncate text-xs text-slate-500">
            {displayRole}
          </span>
        </span>

        <ChevronUp
          className={[
            "size-4 shrink-0 text-slate-500 transition-transform",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function formatRole(role?: string | null) {
  if (!role) {
    return "Workspace Horizon";
  }

  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}