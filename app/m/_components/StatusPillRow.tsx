"use client";
import { BOARD_COLUMNS } from "@/lib/board-columns";
import { STATUS, type StatusKey } from "./StatusChip";

const ORDER: StatusKey[] = ["backlog", "ready", "in_progress", "blocked", "done"];

/** The bd status a pill sets. `blocked` isn't a board drop target but is a valid bd status. */
const bdStatus = (k: StatusKey) => BOARD_COLUMNS.find((c) => c.id === k)?.status ?? "blocked";

/** All five statuses; the current one is filled in its status color, the rest are outline chips. */
export function StatusPillRow({
  current, disabled, onPick,
}: { current: StatusKey; disabled?: boolean; onPick: (bdStatus: string) => void }) {
  return (
    <div role="group" aria-label="Status" className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
      {ORDER.map((k) => {
        const active = k === current;
        const { label, color } = STATUS[k];
        return (
          <button
            key={k} type="button" disabled={disabled || active} aria-pressed={active}
            onClick={() => onPick(bdStatus(k))}
            className={`inline-flex h-9 shrink-0 items-center gap-[7px] whitespace-nowrap rounded-full border px-3 text-[13px] ${
              active ? "font-semibold" : "border-border bg-surface font-medium text-text-2 disabled:opacity-60"
            }`}
            style={active ? { background: `color-mix(in srgb, ${color} 18%, transparent)`, borderColor: color, color } : undefined}
          >
            <span className="inline-block size-[7px] rounded-full" style={{ background: color }} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
