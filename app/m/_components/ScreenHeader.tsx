"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Svg } from "./Svg";

export const headerBtn = "inline-flex size-11 shrink-0 items-center justify-center rounded-full text-text-2 disabled:opacity-40";

/** Back-chevron + label on the left, centered title, `right` actions plus a copy-link overflow (⋯). */
export function ScreenHeader({
  backHref, backLabel, title, mono = false, right,
}: { backHref: string; backLabel: string; title: string; mono?: boolean; right?: ReactNode }) {
  const copyLink = () => {
    if (!navigator.clipboard) return toast.error("Clipboard unavailable in this context");
    navigator.clipboard.writeText(window.location.href).then(
      () => toast.success("Link copied"),
      () => toast.error("Couldn’t copy to clipboard"),
    );
  };
  return (
    <div className="relative flex min-h-12 shrink-0 items-center gap-1 border-b border-border pl-1 pr-2">
      <Link href={backHref} className="inline-flex min-h-11 items-center py-2 pl-1 pr-2 text-[15px] font-medium text-brand">
        <Svg size={22} color="var(--brand)"><path d="M15 6l-6 6 6 6" /></Svg>
        <span className="max-w-[110px] truncate">{backLabel}</span>
      </Link>
      <span className="flex-1" />
      <span
        className={`pointer-events-none absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold ${mono ? "font-mono" : ""}`}
      >
        {title}
      </span>
      {right}
      <button type="button" aria-label="Copy link" className={headerBtn} onClick={copyLink}>
        <Svg size={22}><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" /></Svg>
      </button>
    </div>
  );
}
