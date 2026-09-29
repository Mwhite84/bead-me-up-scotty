"use client";
import * as React from "react";
import type { ReactNode } from "react";
import { Svg } from "./Svg";

/**
 * The one scrim + rounded-top panel + drag-handle pattern shared by the Create
 * and Project sheets. `top` is the panel's distance from the top of the screen;
 * `footer` stays pinned under the scrolling body.
 */
export function BottomSheet({
  title, count, top, onClose, footer, children,
}: {
  title: string; count?: number; top: number; onClose: () => void; footer?: ReactNode; children: ReactNode;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <div className="fixed inset-0 z-40 bg-[rgba(20,20,30,.35)]" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog" aria-modal="true" aria-label={title}
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-[22px] bg-surface shadow-[0_-16px_48px_-8px_rgba(20,20,40,.3)]"
        style={{ top: `max(${top}px, env(safe-area-inset-top))` }}
      >
        <div className="flex justify-center pt-2"><span className="h-[5px] w-9 rounded-full bg-border-strong" /></div>
        <div className="flex min-h-11 items-center gap-2 pb-1 pl-5 pr-2 pt-1.5">
          <span className="text-[17px] font-bold">{title}</span>
          {count !== undefined && <span className="font-mono text-xs text-text-3">{count}</span>}
          <span className="flex-1" />
          <button type="button" aria-label="Close" onClick={onClose} className="inline-flex size-11 items-center justify-center rounded-full text-text-2">
            <Svg size={22}><path d="M6 6l12 12M18 6L6 18" /></Svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-1.5">{children}</div>
        {footer}
      </div>
    </>
  );
}
