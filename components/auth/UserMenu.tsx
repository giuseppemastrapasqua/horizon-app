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

  const displayName =
    name?.trim() || "Utente Horizon";

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
        <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-white/[0.10] bg-[#072B70] shadow-[0_12px_32px_rgba(0,0,0,0.25)]">

          {email ? (
            <div className="border-b border-white/[0.08] px-3.5 py-3">
              <p className="truncate text-[11px] text-blue-100/60">
                {email}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            disabled={isSigningOut}
            onClick={handleSignOut}
            className="flex h-[42px] w-full items-center gap-2.5 px-3.5 text-left text-[12px] font-medium text-blue-50/80 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSigningOut ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}

            {isSigningOut
              ? "Uscita in corso..."
              : "Esci da Horizon"}
          </button>
        </div>
      ) : null}

      <button
        type="button"
        aria-expanded={isOpen}
        aria-label="Apri menu utente"
        onClick={() =>
          setIsOpen((currentValue) => !currentValue)
        }
        className="flex w-full items-center gap-3 rounded-xl border border-white/[0.10] bg-white/[0.055] px-2.5 py-2 text-left transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/10"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[#1769FF] text-white shadow-sm">
          <UserRound
            size={18}
            strokeWidth={1.9}
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold text-white">
            {displayName}
          </span>

          <span className="mt-[1px] block truncate text-[11px] text-blue-100/50">
            {displayRole}
          </span>
        </span>

        <ChevronUp
          size={14}
          className={[
            "shrink-0 text-blue-100/40 transition-transform",
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
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}
