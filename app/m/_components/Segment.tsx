import type { ReactNode } from "react";

/** One option in a header segmented control (Focus's All/By assignee, Graph's Ladder/Map). */
export function Segment({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button" aria-pressed={on} onClick={onClick}
      className={`inline-flex h-[30px] items-center rounded-full px-3 text-xs ${on ? "bg-brand-weak font-semibold text-brand-2" : "font-medium text-text-2"}`}
    >
      {children}
    </button>
  );
}

/** Pill container that groups Segments. */
export function SegmentGroup({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full border border-border bg-surface p-[3px]">{children}</span>;
}
