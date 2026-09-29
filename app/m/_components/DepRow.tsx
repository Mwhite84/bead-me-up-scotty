"use client";
import type { Bead } from "@/lib/schema";
import { StatusDot, statusKey } from "./StatusChip";
import { Svg } from "./Svg";

/**
 * One dependency row. `label` is the relation from this bead's point of view
 * ("blocked by" / "blocks"); it is red while the edge is still holding something
 * up and green once resolved. A closed dependency shows a check, an open one a chevron.
 */
export function DepRow({
  target, targetId, label, blocking, resolved, onOpen,
}: {
  target?: Bead; targetId: string; label: string;
  blocking: boolean; resolved: boolean; onOpen: (id: string) => void;
}) {
  const tone = resolved ? "var(--st-done)" : blocking ? "var(--st-blocked)" : "var(--text-2)";
  const closed = target?.status === "closed";
  return (
    <button
      type="button" onClick={() => onOpen(targetId)}
      className="flex min-h-[52px] w-full items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-left"
    >
      <StatusDot status={target ? statusKey(target) : "ready"} />
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate text-sm font-medium text-text">{target?.title ?? targetId}</span>
        <span className="flex items-center gap-2">
          <span className="whitespace-nowrap font-mono text-[11px] text-text-3">{targetId}</span>
          <span
            className="whitespace-nowrap rounded-full px-2 py-[5px] font-mono text-[11px] font-medium leading-none"
            style={{ background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }}
          >
            {label}
          </span>
        </span>
      </span>
      {closed ? (
        <Svg size={18} stroke={2} color="var(--st-done)"><path d="M5 12l5 5 9-10" /></Svg>
      ) : (
        <Svg size={18} color="var(--text-3)"><path d="M9 6l6 6-6 6" /></Svg>
      )}
    </button>
  );
}
