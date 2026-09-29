"use client";
import * as React from "react";
import { filterDepCandidates } from "@/lib/dep-picker";
import type { Bead } from "@/lib/schema";
import { StatusDot, statusKey } from "./StatusChip";
import { Svg } from "./Svg";

/**
 * Full-screen search-and-select list. Tapping a bead makes the current bead
 * "blocked by" it (the default `blocks` edge, like the desktop editor). The
 * dependency ladder view is a separate bead.
 */
export function DepPicker({
  beads, currentId, linkedIds, pending, onPick, onClose,
}: {
  beads: Bead[]; currentId: string; linkedIds: string[]; pending: boolean;
  onPick: (id: string) => void; onClose: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const candidates = filterDepCandidates(beads, query, { currentId, linkedIds }).slice(0, 50);
  return (
    <div role="dialog" aria-label="Add dependency" className="fixed inset-0 z-50 flex flex-col bg-background" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="flex min-h-12 shrink-0 items-center gap-2 border-b border-border px-3">
        <Svg size={18} color="var(--text-3)"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></Svg>
        <input
          autoFocus type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search id or title"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none"
        />
        <button type="button" onClick={onClose} className="min-h-11 px-2 text-[15px] font-medium text-brand">Cancel</button>
      </div>
      <p className="shrink-0 px-4 py-2 text-xs text-text-3">Tap a bead to make {currentId} blocked by it.</p>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-8">
        {candidates.length === 0 && <p className="py-10 text-center text-sm text-text-3">No matching beads.</p>}
        {candidates.map((b) => (
          <button
            key={b.id} type="button" disabled={pending} onClick={() => onPick(b.id)}
            className="flex min-h-[52px] items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5 text-left disabled:opacity-60"
          >
            <StatusDot status={statusKey(b)} />
            <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
              <span className="truncate text-sm font-medium text-text">{b.title}</span>
              <span className="font-mono text-[11px] text-text-3">{b.id}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
