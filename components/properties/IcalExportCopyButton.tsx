"use client";

import {
  useState,
} from "react";

import {
  copyToClipboard,
} from "@/lib/browser/copy-to-clipboard";

type Props = {
  url: string;
};

export function IcalExportCopyButton({
  url,
}: Props) {
  const [copied, setCopied] =
    useState(false);

  async function handleCopy() {
    await copyToClipboard(url);

    setCopied(true);

    window.setTimeout(
      () => setCopied(false),
      1800,
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
    >
      {copied
        ? "Copiato"
        : "Copia URL"}
    </button>
  );
}
