"use client";
import { StatusChip, type StatusKey } from "./StatusChip";

export const LANES: StatusKey[] = ["backlog", "ready", "in_progress", "blocked", "done"];

/** Horizontally scrollable lane filter; one tap target per status, counts always visible. */
export function LaneChips({
  counts, selected, onSelect,
}: { counts: Record<StatusKey, number>; selected: StatusKey; onSelect: (s: StatusKey) => void }) {
  return (
    <div role="tablist" aria-label="Status lane" className="flex shrink-0 gap-2 overflow-x-auto px-5 pb-2.5 pt-0.5 [scrollbar-width:none]">
      {LANES.map((s) => (
        <button
          key={s} type="button" role="tab" aria-selected={s === selected}
          onClick={() => onSelect(s)} className="shrink-0 rounded-full"
        >
          <StatusChip status={s} count={counts[s]} active={s === selected} />
        </button>
      ))}
    </div>
  );
}
